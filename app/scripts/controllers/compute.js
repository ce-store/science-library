/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals $: true */

angular.module('itapapersApp')

.controller('ComputeCtrl', ['$scope', '$stateParams', 'store', 'urls', 'utils', 'definitions', 'drupal', function ($scope, $stateParams, store, urls, utils, ce, drupal) {
  'use strict';

  $scope.computedCe = [];
//  $scope.computedCe.push('perform reset store with starting uid \'1\'.');
  $scope.computedCe.push('--Loading model...');

  var appendErrors = function(response) {
    var alerts = response.data.alerts;
    if (alerts.errors.length) {
      $scope.computedCe.push('--Alerts:');
      for (var i in alerts.errors) {
        var msg = alerts.errors[i];
        $scope.computedCe.push('--' + msg);
      }
    }
    if (alerts.warnings.length) {
      $scope.computedCe.push('--Warnings:');
      for (var i in alerts.warnings) {
        var msg = alerts.warnings[i];
        $scope.computedCe.push('--' + msg);
      }
    }
  };

  drupal.loadModel().then(function(response) {
    appendErrors(response);
    $scope.computedCe.push('--Loaded model');
    $scope.computedCe.push(' ');
    $scope.computedCe.push('--Loading facts...');

    drupal.loadDocuments().then(function(response) {
      appendErrors(response);
      $scope.computedCe.push('--Loaded facts');
      $scope.computedCe.push(' ');
      $scope.computedCe.push('--Loading rules...');

      drupal.loadRules().then(function(response) {
        appendErrors(response);
        $scope.computedCe.push('--Loaded rules');
        $scope.computedCe.push(' ');
        $scope.computedCe.push('--Computing data...');

        computeData();
      });
    });
  });

  var computeData = function() {
    store.getDataForCompute()
      .then(function(results) {
        var papers = {};
        var external_papers = {};
        var oas = {};
        var people = {};
        var organisations = {};
        var citations = {};
        var cas = {};
        var tps = {};
        var tos = {};
        var dates = {};

        var i, inst;
        for (i in results[ce.concepts.document]) {
          inst = results[ce.concepts.document][i];
          inst.instances = {};
          inst.values = {};

          inst.instances["citation count"] = [];
          inst.instances["ordered authors"] = [];
          inst.instances["written by"] = [];
          inst.values["citation count"] = null;
          inst.values["weight"] = null;
          inst.extraTypes = [];

          papers[inst._id] = inst;

          if ((inst.concept_names.indexOf(ce.concepts.externalDocument) > -1)) {
            external_papers[inst._id] = inst;
          }
        }

        for (i in results[ce.concepts.orderedAuthor]) {
          inst = results[ce.concepts.orderedAuthor][i];
          inst.instances = {};
          inst.values = {};

          inst.instances["author person"] = null;

          oas[inst._id] = inst;
        }

        for (i in results[ce.concepts.publishedPerson]) {
          inst = results[ce.concepts.publishedPerson][i];
          inst.instances = {};
          inst.values = {};

          inst.instances["wrote"] = [];
          inst.instances["writes documents for"] = null;
          inst.values["citation count"] = null;
          inst.values["h-index"] = null;

          people[inst._id] = inst;
        }

        for (i in results[ce.concepts.publishedOrganisation]) {
          inst = results[ce.concepts.publishedOrganisation][i];
          inst.instances = {};
          inst.values = {};

          inst.instances["employs"] = [];

          organisations[inst._id] = inst;
        }

        for (i in results[ce.concepts.paperCitationCount]) {
            inst = results[ce.concepts.paperCitationCount][i];
            inst.instances = {};
            inst.values = {};

            citations[inst._id] = inst;
        }

        for (i in results[ce.concepts.coAuthorStatistic]) {
          inst = results[ce.concepts.coAuthorStatistic][i];
          inst.instances = {};
          inst.values = {};

          inst.values["co-author count"] = [];

          cas[inst._id] = inst;
        }

        for (i in results[ce.concepts.topicPersonStatistic]) {
          inst = results[ce.concepts.topicPersonStatistic][i];
          inst.instances = {};
          inst.values = {};

          inst.values["paper count"] = [];

          tps[inst._id] = inst;
        }

        for (i in results[ce.concepts.topicOrganisationStatistic]) {
          inst = results[ce.concepts.topicOrganisationStatistic][i];
          inst.instances = {};
          inst.values = {};

          inst.values["paper count"] = [];

          tos[inst._id] = inst;
        }

        buildLinks(papers, citations, oas, people, organisations, cas, dates);

        computePersonCitations(people);
        computePersonHIndex(people);
        computeDocumentWeights(papers, people, organisations);
        computeDocumentTypes(papers);
        computeCoauthorCounts(cas, people);
        computeTopicPersonCounts(tps);
        computeTopicOrganisationCounts(tos);

        ceForPersonCitations(people);
        ceForDocumentWeights(papers);
        ceForDocumentTypes(papers);
        ceForCoauthorCounts(cas);
        ceForTopicPersonCounts(tps);
        ceForTopicOrganisationCounts(tos);

        computeTotals(dates, external_papers);
        ceForTotals(dates);

        ceForUiMessage(dates);

        saveCeToStore();

        console.log("all done");
      });
  };

  function saveCeToStore() {
    var url = urls.server + urls.ceStore + "/sources/computedCe?showStats=true&action=save";
    var ce = "";

    for (var i in $scope.computedCe) {
      ce += $scope.computedCe[i] + "\n\n";
    }

    $.ajax({
      type: "POST",
      url: url,
      data: ce,
      contentType: "text/plain;charset=UTF-8"
    });
  }

  function buildLinks(papers, citations, oas, people, organisations, cas, dates) {
    var key;
    for (key in papers) {
      if (papers.hasOwnProperty(key)) {
        var paper = papers[key];
        var pubYear = paper.property_values["publication year"];

        if (pubYear) {
            dates[pubYear] = { papers: [], people: [] };
        }

        linkPaperCitationCounts(paper, citations);
        linkPaperOrderedAuthors(paper, oas, people);
      }
    }

    for (key in people) {
      if (people.hasOwnProperty(key)) {
        var person = people[key];

        linkPersonOrgs(person, organisations);
      }
    }

    dates["all"] = { papers: [], people: [] };
  }

  function linkPaperCitationCounts(paper, citations) {
      var ccNames = paper.property_values["citation count"];

    if (ccNames) {
      for (var i = 0; i < ccNames.length; ++i) {
        var ccName = ccNames[i];
        var ccInst = citations[ccName];

        if (ccInst) {
          paper.instances["citation count"].push(ccInst);
          paper.values["citation count"] = 0;
          if (ccInst.property_values["citation count"]) {
            paper.values["citation count"] = ccInst.property_values["citation count"][0] || 0;
          }
        } else {
          console.log("No ccInst for " + paper._id);
        }
      }
    } else {
      console.log("No ccNames for " + paper._id);
      }
  }

  function linkPersonOrgs(person, organisations) {
    var orgNames = person.property_values["writes documents for"];

    if (orgNames) {
      var org = organisations[orgNames[0]];

      if (org) {
        person.instances["writes documents for"] = org;
        org.instances["employs"].push(person);
      } else {
        console.log("No org for " + person._id);
      }
    } else {
      console.log("No orgNames for " + person._id);
    }
  }

  function linkPaperOrderedAuthors(paper, oas, people) {
    var oaNames = paper.property_values["author"];

    if (oaNames) {
      for (var i = 0; i < oaNames.length; ++i) {
        var oaName = oaNames[i];
        var oaInst = oas[oaName];

        if (oaInst) {
          paper.instances["ordered authors"].push(oaInst);
          var personNames = oaInst.property_values["author person"];

          if (personNames) {
            for (var j = 0; j < personNames.length; ++j) {
              var personName = personNames[j];
              var person = people[personName];

              oaInst.instances["author person"] = person;
              person.instances["wrote"].push(paper);
              paper.instances["written by"].push(person);
            }
          } else {
            console.log("No personNames for " + oaInst._id);
          }
        } else {
          console.log("No oaInst for " + paper._id);
        }
      }
    } else {
      console.log("No oaNames for " + paper._id);
    }
  }

  function computePersonCitations(people) {
    for (var personId in people) {
      if (people.hasOwnProperty(personId)) {
        var person = people[personId];
        var pcc = 0;

        for (var paperId in person.instances["wrote"]) {
          var paper = person.instances["wrote"][paperId];

          pcc += parseInt(paper.values["citation count"]);
        }

        person.values["citation count"] = pcc;
      }
    }
  }

  function computePersonHIndex(people) {
    for (var personId in people) {
      if (people.hasOwnProperty(personId)) {
        var person = people[personId];
        var ccList = [];

        for (var paperId in person.instances["wrote"]) {
          var paper = person.instances["wrote"][paperId];
          var pcc = paper.values["citation count"];

          if (pcc > 0) {
            ccList.push(parseInt(pcc));
          }
        }

        person.values["h-index"] = calculateHIndex(ccList);
      }
    }
  }

  function computeDocumentWeights(papers, people, organisations) {
    for (var paperId in papers) {
      var types = [];
      var weight = 0;

      if (papers.hasOwnProperty(paperId)) {
        var paper = papers[paperId];
        var authors = paper.instances["written by"];

        for (var i in authors) {
          var person = authors[i];
          var org = person.instances["writes documents for"];
          var type = null;

          if (org) {
            type = utils.getIndustryFor(org);
            if (type != null) {
              var country = utils.getUnknownProperty(org.property_values, "is affiliated to");

              type += "-" + country;
              if (types.indexOf(type) === -1) {
                types.push(type);
              }
            }
          }

          if (person.concept_names.indexOf(ce.concepts.corePerson) > -1) {
            weight += 100;
          }
        }

        weight += types.length * 1000;
        paper.values["weight"] = weight;
      }
    }
  }

  function computeDocumentTypes(papers) {
    for (var paperId in papers) {
      if (papers.hasOwnProperty(paperId)) {
        var paper = papers[paperId];
        var allOrgs = [];
        var org;

        for (var personId in paper.instances["written by"]) {
          var person = paper.instances["written by"][personId];

          org = person.instances["writes documents for"];

          if (org) {
            if (allOrgs.indexOf(org) === -1) {
              allOrgs.push(org);
            }
          }
        }

        if (allOrgs.length === 1) {
          paper.extraTypes.push("a " + ce.concepts.singleInstituteDocument);
        } else {
          var countries = [];

          for (var i in allOrgs) {
            org = allOrgs[i];
            var country = null;

            if (org.property_values["is affiliated to"]) {
              country = org.property_values["is affiliated to"][0];
            }

            //Remove this if/when countries other than US and UK will be counted
            if ((country === "UK") || (country === "US")) {
              if (countries.indexOf(country) === -1) {
                countries.push(country);
              }
            }
          }

          if (allOrgs.length > 1) {
            paper.extraTypes.push("a " + ce.concepts.collaborativeDocument);
          }

          if (countries.length > 1) {
              paper.extraTypes.push("an " + ce.concepts.internationalDocument);
          }
        }
      }
    }
  }

  function computeCoauthorCounts(cas, people) {
    for (var casId in cas) {
      if (cas.hasOwnProperty(casId)) {
        var ca = cas[casId];

        var cName = ca.property_values["co-author"][0];
        var mName = ca.property_values["main-author"][0];

        var cper = people[cName];
        var mper = people[mName];
        var papers1 = cper.instances["wrote"];
        var papers2 = mper.instances["wrote"];
        var joint = [];

        for (var i1 in papers1) {
          var p1 = papers1[i1];
          for (var i2 in papers2) {
            var p2 = papers2[i2];

            if (p1 === p2) {
              if (joint.indexOf(p1) === -1) {
                joint.push(p1);
              }
            }
          }
        }

        ca.values["co-author count"] = joint.length;
      }
    }
  }

  function computeTopicPersonCounts(tps) {
    for (var tpsId in tps) {
      if (tps.hasOwnProperty(tpsId)) {
        var tp = tps[tpsId];

        tp.values["paper count"] = tp.property_values["document"].length;
      }
    }
  }

  function computeTopicOrganisationCounts(tos) {
    for (var tosId in tos) {
      if (tos.hasOwnProperty(tosId)) {
        var to = tos[tosId];

        to.values["paper count"] = to.property_values["document"].length;
      }
    }
  }

  function computeTotals(dates, papers) {
    var allItaAuthors = [];
    var allNonItaAuthors = [];

    var i, j, k;
    var date, paper, person;
    for (i in dates) {
      date = dates[i];

      for (j in papers) {
        paper = papers[j];

          if (paper.property_values["publication year"] && paper.property_values["publication year"][0] === i) {
            date.papers.push(paper);

          for (k in paper.instances["written by"]) {
            person = paper.instances["written by"][k];

            if (date.people.indexOf(person) === -1) {
              date.people.push(person);
            }
          }
        }
      }
    }

    for (i in dates) {
      date = dates[i];
      var siCount = 0;
      var cCount = 0;
      var iCount = 0;
      var gCount = 0;
      var jCount = 0;
      var ecCount = 0;
      var pCount = 0;
      var ccTot = 0;
      var iAuths = 0;
      var itaAuthors = [];
      var nonItaAuthors = [];

      date.stats = {};
      date.stats["total paper count"] = date.papers.length;

      for (j in date.papers) {
        paper = date.papers[j];

        for (k in paper.instances["written by"]) {
          person = paper.instances["written by"][k];

          if (person) {
            if (person.concept_names.indexOf(ce.concepts.corePerson) > -1) {
              if (itaAuthors.indexOf(person) === -1) {
                itaAuthors.push(person);
              }
              if (allItaAuthors.indexOf(person) === -1) {
                allItaAuthors.push(person);
              }
            } else {
              if (nonItaAuthors.indexOf(person) === -1) {
                nonItaAuthors.push(person);
              }
              if (allNonItaAuthors.indexOf(person) === -1) {
                allNonItaAuthors.push(person);
              }
            }
          }
        }

        if (paper.extraTypes.indexOf("a " + ce.concepts.singleInstituteDocument) > -1) {
          ++siCount;
        }
        if (paper.extraTypes.indexOf("a " + ce.concepts.collaborativeDocument) > -1) {
          ++cCount;
        }
        if (paper.extraTypes.indexOf("an " + ce.concepts.internationalDocument) > -1) {
          ++iCount;
        }
        if (paper.concept_names.indexOf(ce.concepts.governmentDocument) > -1) {
          ++gCount;
        }
        if (paper.concept_names.indexOf(ce.concepts.journalPaper) > -1) {
          ++jCount;
        }
        if (paper.concept_names.indexOf(ce.concepts.externalConferencePaper) > -1) {
          ++ecCount;
        }
        if (paper.concept_names.indexOf(ce.concepts.patent) > -1) {
          ++pCount;
        }

        var cc = paper.instances["citation count"][0];

        if (cc) {
          if (cc.property_values["citation count"]) {
            ccTot += parseInt(cc.property_values["citation count"][0] || "0");
          } else {
            console.log("no citation count for " + cc._id);
          }
        }
      }

      date.stats["single institute paper count"] = siCount;
      date.stats["collaborative paper count"] = cCount;
      date.stats["international paper count"] = iCount;
      date.stats["government paper count"] = gCount;
      date.stats["journal paper count"] = jCount;
      date.stats["external conference paper count"] = ecCount;
      date.stats["patent count"] = pCount;
      date.stats["total citations"] = ccTot;
      date.stats["ITA authors"] = itaAuthors.length;
      date.stats["non-ITA authors"] = nonItaAuthors.length;
    }

    var tTotal = 0;
    var siTotal = 0;
    var cTotal = 0;
    var iTotal = 0;
    var gTotal = 0;
    var jTotal = 0;
    var ecTotal = 0;
    var pTotal = 0;
    var totCc = 0;

    for (i in dates) {
      date = dates[i];

      if (i !== "all") {
        tTotal += date.stats["total paper count"];
        siTotal += date.stats["single institute paper count"];
        cTotal += date.stats["collaborative paper count"];
        iTotal += date.stats["international paper count"];
        gTotal += date.stats["government paper count"];
        jTotal += date.stats["journal paper count"];
        ecTotal += date.stats["external conference paper count"];
        pTotal += date.stats["patent count"];
        totCc += date.stats["total citations"];
      }
    }

    dates["all"].stats["total paper count"] = tTotal;
    dates["all"].stats["single institute paper count"] = siTotal;
    dates["all"].stats["collaborative paper count"] = cTotal;
    dates["all"].stats["international paper count"] = iTotal;
    dates["all"].stats["government paper count"] = gTotal;
    dates["all"].stats["journal paper count"] = jTotal;
    dates["all"].stats["external conference paper count"] = ecTotal;
    dates["all"].stats["patent count"] = pTotal;
    dates["all"].stats["total citations"] = totCc;
    dates["all"].stats["ITA authors"] = allItaAuthors.length;
    dates["all"].stats["non-ITA authors"] = allNonItaAuthors.length;
  }

  function calculateHIndex(ccList) {
    var h, i, j = null;

    if (ccList.length === 0) {
      h = 0;
    } else if (ccList.length === 1) {
      h = 1;
    } else {
      ccList.sort(function(a,b) { return a-b;});
      h = 1;

      for (i in ccList) {
        var cc = ccList[i];
        var gt = 0;

        for (j in ccList) {
          if (ccList[j] >= cc) {
            gt++;
          }
        }

        if (gt >= cc) {
          h = cc;
        }
      }
    }

    return h;
  }

  function ceForPersonCitations(people) {
    var hdrText = "";
    hdrText += "---------------------------------------------------\n";
    hdrText += "-- published person:local citation count, local h-index\n";
    hdrText += "---------------------------------------------------\n";
    $scope.computedCe.push(hdrText);

    for (var personId in people) {
      if (people.hasOwnProperty(personId)) {
        var person = people[personId];
        var cc = person.values["citation count"];
        var h = person.values["h-index"];

        var ceText = "";
        ceText += "the published person '" + encodeForCe(person._id) + "'\n";
        ceText += "  has '" + encodeForCe(cc) + "' as local citation count and\n";
        ceText += "  has '" + encodeForCe(h) + "' as local h-index.";

        $scope.computedCe.push(ceText);
      }
    }
  }

  function ceForDocumentWeights(papers) {
    var hdrText = "";
      hdrText += "-----------------------------------------------------------------------\n";
      hdrText += "-- document:weight\n";
      hdrText += "-----------------------------------------------------------------------\n";
    $scope.computedCe.push(hdrText);

    for (var paperId in papers) {
      if (papers.hasOwnProperty(paperId)) {
        var paper = papers[paperId];
        var ceText = "";

        ceText += "the document '" + encodeForCe(paper._id) + "'\n";
        ceText += "  has '" + encodeForCe(paper.values["weight"]) + "' as weight.";

        $scope.computedCe.push(ceText);
      }
    }
  }

  function ceForDocumentTypes(papers) {
    var hdrText = "";
    hdrText += "-------------------------\n";
    hdrText += "-- compute document types\n";
    hdrText += "-------------------------\n";
    $scope.computedCe.push(hdrText);

    for (var paperId in papers) {
      var paper = papers[paperId];
      var ceText = "";
      var firstTime = true;

      ceText = "the document '" + encodeForCe(paper._id) + "'\n";

      for (var typeId in paper.extraTypes) {
        var extraType = paper.extraTypes[typeId];

        if (!firstTime) {
          ceText += " and\n";
        }

        ceText += "  is " + extraType;
        firstTime = false;
      }

      ceText += ".";
      $scope.computedCe.push(ceText);
    }
  }

  function ceForCoauthorCounts(cas) {
    var hdrText = "";
    hdrText += "--------------------------------------\n";
    hdrText += "-- co-author statistic:co-author count\n";
    hdrText += "--------------------------------------\n";
    $scope.computedCe.push(hdrText);

    for (var i in cas) {
      var ca = cas[i];
      var ceText = "";

      ceText += "the co-author statistic '" + encodeForCe(ca._id) + "'\n";
      ceText += "  has '" + ca.values["co-author count"] + "' as co-author count.";

      $scope.computedCe.push(ceText);
    }
  }

  function ceForTopicPersonCounts(tps) {
    var hdrText = "";
    hdrText += "-------------------------------------\n";
    hdrText += "-- topic-person statistic:paper count\n";
    hdrText += "-------------------------------------\n";
    $scope.computedCe.push(hdrText);

    for (var i in tps) {
      var tp = tps[i];
      var ceText = "";

      ceText += "the topic-person statistic '" + encodeForCe(tp._id) + "'\n";
      ceText += "  has '" + tp.values["paper count"] + "' as paper count.";

      $scope.computedCe.push(ceText);
    }
  }

  function ceForTopicOrganisationCounts(tos) {
    var hdrText = "";
    hdrText += "-------------------------------------------\n";
    hdrText += "-- topic-organisation statistic:paper count\n";
    hdrText += "-------------------------------------------\n";
    $scope.computedCe.push(hdrText);

    for (var i in tos) {
      var to = tos[i];
      var ceText = "";

      ceText += "the topic-organisation statistic '" + encodeForCe(to._id) + "'\n";
      ceText += "  has '" + to.values["paper count"] + "' as paper count.";

      $scope.computedCe.push(ceText);
    }
  }

  function ceForTotals(dates) {
    var hdrText = "";
    hdrText += "-------------------------\n";
    hdrText += "-- total:(all properties)\n";
    hdrText += "-------------------------\n";
    $scope.computedCe.push(hdrText);

    for (var i in dates) {
      var date = dates[i];
      var ceText = "";

      ceText += "the total 'total_" + i + "'\n";
      ceText += "  has '" + i + "' as scope and\n";
      ceText += "  has '" + date.stats["total paper count"] + "' as total paper count and\n";
      ceText += "  has '" + date.stats["single institute paper count"] + "' as single institute paper count and\n";
      ceText += "  has '" + date.stats["collaborative paper count"] + "' as collaborative paper count and\n";
      ceText += "  has '" + date.stats["international paper count"] + "' as international paper count and\n";
      ceText += "  has '" + date.stats["government paper count"] + "' as government paper count and\n";
      ceText += "  has '" + date.stats["journal paper count"] + "' as journal paper count and\n";
      ceText += "  has '" + date.stats["external conference paper count"] + "' as external conference paper count and\n";
      ceText += "  has '" + date.stats["patent count"] + "' as patent count and\n";
      ceText += "  has '" + date.stats["ITA authors"] + "' as active ITA authors and\n";
      ceText += "  has '" + date.stats["non-ITA authors"] + "' as active non-ITA authors and\n";
      ceText += "  has '" + date.stats["total citations"] + "' as total citations.";

      $scope.computedCe.push(ceText);
    }
  }

  function ceForUiMessage(dates) {
    var hdrText = "";
    hdrText += "-------------\n";
    hdrText += "-- UI message\n";
    hdrText += "-------------\n";
    $scope.computedCe.push(hdrText);

    var ceText = "";
    ceText += "there is a UI message named 'msg computed' that\n";
    ceText += "  has 'All data has been computed for the Science Library' as message text.";
    $scope.computedCe.push(ceText);
  }

  var encodeForCe = function(pValue) {
    var result = null;

    if (pValue != null) {
      result = String(pValue);
      result = result.replace(/\\/g, '\\\\');
      result = result.replace(new RegExp('\'', 'g'), '\\\'');
      result = result.replace(new RegExp('‘', 'g'), '\\‘');
      result = result.replace(new RegExp('’', 'g'), '\\’');
      result = result.replace(new RegExp('“', 'g'), '\\“');
      result = result.replace(new RegExp('”', 'g'), '\\”');
      result = result.replace(/(?:\r\n|\r|\n)/g, ' ');
    } else {
      result = '';
    }

    return result;
  };
}]);
