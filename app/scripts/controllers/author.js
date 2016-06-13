'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:AuthorCtrl
 * @description
 * # AuthorCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('AuthorCtrl', ['$scope', '$stateParams', '$timeout', 'store', 'urls', 'hudson', 'documentTypes', 'utils', 'csv', 'colours', 'definitions', function ($scope, $stateParams, $timeout, store, urls, hudson, documentTypes, utils, csv, colours, ce) {
    var dataMain = null;
    var dataPapers = null;
    var dataCoAuthors = null;

    $scope.views = ['graph', 'papers', 'co-authors', 'co-authors-graph'];
    $scope.scienceLibrary = urls.scienceLibrary;
    $scope.journalType            = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.patentType             = documentTypes.patent;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType    = documentTypes.technical;
    $scope.otherDocumentType      = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = $scope.acInput = $scope.indInput = $scope.govInput = true;

    $scope.sortTypes = {
      papers: {
        names:    ['most collaborative', 'citation count', 'most recent', 'name'],
        values:   ['weight', 'citations', 'date', 'name'],
        show:     [false, true, false, false],
        reverse:  ['-', '-', '-', '+']
      },
      coAuthors: {
        names:    ['shared paper count', 'name'],
        values:   ['count', 'name'],
        show:     [true, false],
        reverse:  ['-', '+']
      }
    };

    var lastHighlight = null;
    var types = documentTypes.nameMap;

    $scope.$on('question:added', function() {
      refreshHighlight();
    });

//    var generateCSVData = function() {
//      // csv
//      var csvData = [];
//      if ($scope.currentView === $scope.views[0] || $scope.currentView === $scope.views[1]) {
//        for (var paper in $scope.papersList) {
//          if ($scope.papersList.hasOwnProperty(paper)) {
//            var p = $scope.papersList[paper];
//            for (var i in p.type) {
//              if (p.type.hasOwnProperty(i)) {
//                csvData.push([p.id, p.name, p.citations, p.type[i], p.venue, p.authors]);
//              }
//            }
//          }
//        }
//
//        csv.setData(csvData);
//        csv.setHeader(["paper id", "paper name", "citation count", "paper type", "venue", "authors"]);
//        csv.setName($stateParams.authorId + "_papers");
//      } else {
//        for (var coAuthor in $scope.coauthorsList) {
//          if ($scope.coauthorsList.hasOwnProperty(coAuthor)) {
//            var ca = $scope.coauthorsList[coAuthor];
//            csvData.push([ca.id, ca.name, ca.count]);
//          }
//        }
//
//        csv.setData(csvData);
//        csv.setHeader(["author id", "author name", "co-authored papers count"]);
//        csv.setName($stateParams.authorId + "_coauthors");
//      }
//    };

    $scope.showView = function (view) {
      $scope.currentView = view;

      if (view === $scope.views[0]) {
        angular.element("svg.chart").remove();
        // Wait for doms to be created
        $timeout(function() {
          drawNarrativeChart($stateParams.authorId, true, false, false, $scope.data, urls.server, urls.ceStore, $scope.scienceLibrary, utils, ce);
        }, 100);
      }

      if (view === $scope.views[1]) {
        $scope.sort   = $scope.sortTypes.papers;
        $scope.header = $scope.papersHeader;
      } else if (view === $scope.views[2]) {
        $scope.sort   = $scope.sortTypes.coAuthors;
        $scope.header = $scope.coAuthorsHeader;
      }

//      generateCSVData();
    };

    var refreshHighlight = function() {
      var qa = hudson.getLatestQuestion();

      if (lastHighlight) {
        $scope[lastHighlight] = false;
      }

      if (qa && qa.type === 'highlight') {
        $scope[qa.property + 'Highlight'] = true;
        lastHighlight = qa.property + 'Highlight';

        if (qa.property === ce.author.documentList) {
          $scope.showView($scope.views[1]);
        } else if (qa.property === ce.author.coAuthorList) {
          $scope.showView($scope.views[2]);
        }
      }
    };

    $scope.filterPapers = function(value) {
      if (typeof value.type !== 'undefined') {
        return ($scope.journalInput &&
            value.type.indexOf(types[$scope.journalType]) > -1) ||
          ($scope.externalInput &&
            value.type.indexOf(types[$scope.externalConferenceType]) > -1) ||
          ($scope.internalInput &&
            value.type.indexOf(types[$scope.patentType]) > -1) ||
          ($scope.patentInput &&
            value.type.indexOf(types[$scope.internalConferenceType]) > -1) ||
          ($scope.technicalInput &&
            value.type.indexOf(types[$scope.technicalReportType]) > -1) ||
          ($scope.otherInput &&
            value.type.indexOf(types[$scope.otherDocumentType]) > -1);
      }
    };

    // get window size
    $scope.width = window.innerWidth;
    $scope.height = window.innerHeight;

    // set max-height of publication list
    var elem = angular.element("#narrative-chart");
    var height = $scope.height - 215;
    elem.css("height", (height - 10) + "px");
    elem.css("max-height", (height - 10) + "px");

    // set max-height of coauthors list
    elem = angular.element("#authors-publications-list");
    elem.css("height", height + "px");
    elem.css("max-height", height + "px");

    elem = angular.element("#authors-publications-list .results-list");
    elem.css("height", "calc(100% - 50px)");

    // set height of narrative chart
    elem = angular.element("#authors-coauthors-list");
    elem.css("height", height + "px");
    elem.css("max-height", height + "px");

    elem = angular.element("#authors-coauthors-list .results-list");
    elem.css("height", "calc(100% - 50px)");

    // set height of narrative chart
    elem = angular.element("#authors-coauthors-chart");
    elem.css("height", height + "px");
    elem.css("max-height", height + "px");

    store.getAuthorMain($stateParams.authorId)
      .then(function(dm) {
        dataMain = dm;
//console.log("dataMain");
//console.log(dataMain);
        store.getAuthorPapers($stateParams.authorId)
        .then(function(dp) {
          dataPapers = dp;
//console.log("dataPapers");
//console.log(dataPapers);
          store.getAuthorCoAuthors($stateParams.authorId)
            .then(function(dc) {
            dataCoAuthors = dc;
//console.log("dataCoAuthors");
//console.log(dataCoAuthors);

            var data = mergeResponses(dataMain, dataPapers, dataCoAuthors);

        $scope.data = data;
        var properties = data.main_instance.property_values;
        var relatedInstances = data.related_instances;

        // get properties
        var fullName = utils.getUnknownProperty(properties, ce.author.fullName);
        var coAuthorList = utils.getListProperty(properties, ce.author.coAuthorList);
        var documentList = utils.getListProperty(properties, ce.author.documentList);
        var documentCount = utils.getIntProperty(properties, ce.author.documentCount);
        var externalDocumentCount = utils.getIntProperty(properties, ce.author.externalDocumentCount);
        var internalDocumentCount = utils.getIntProperty(properties, ce.author.internalDocumentCount);
        var journalCount = utils.getIntProperty(properties, ce.author.journalCount);
        var patentCount = utils.getIntProperty(properties, ce.author.patentCount);
        var externalConferencePaperCount = utils.getIntProperty(properties, ce.author.externalConferencePaperCount);
        var internalConferencePaperCount = utils.getIntProperty(properties, ce.author.internalConferencePaperCount);
        var technicalReportCount = utils.getIntProperty(properties, ce.author.technicalReportCount);
        var otherCount = utils.getIntProperty(properties, ce.author.otherCount);
        var coAuthorCount = utils.getIntProperty(properties, ce.author.coAuthorCount);
        var governmentCoAuthorCount = utils.getIntProperty(properties, ce.author.governmentCoAuthorCount);
        var googleCitationCount = utils.getIntProperty(properties, ce.author.googleCitationCount);
        var localCitationCount = utils.getIntProperty(properties, ce.author.localCitationCount);
        var localHIndex = utils.getIntProperty(properties, ce.author.localHIndex);
        var writesFor = utils.getListProperty(properties, ce.author.writesFor);
        var writesAbout = utils.getUnknownProperty(properties, ce.author.writesAbout);
        var coAuthorStatistic = utils.getListProperty(properties, ce.author.coAuthorStatistic);
        var topicPersonStatistic = utils.getListProperty(properties, ce.author.topicPersonStatistic);

        // Set data
        $scope.authorId = $stateParams.authorId;
        $scope.author = fullName;
        $scope.type = utils.getIndustryFor(data.main_instance);
        $scope.coAuthorsHeader = $scope.author + "'s co-authors";
        $scope.papersHeader = $scope.author + "'s papers";

        // Organisations
        $scope.organisations = [];

        for (var i = 0; i < writesFor.length; ++i) {
          var org = writesFor[i];
          var relatedOrganisation = relatedInstances[org];

          if (relatedOrganisation) {
            var organisationProps = relatedOrganisation.property_values;

            // organisation properties
            var orgID   = relatedOrganisation._id;
            var orgName = utils.getProperty(organisationProps, ce.organisation.name);
            var orgType = utils.getIndustryFor(relatedOrganisation);

            var organisationToAdd = {
              id: orgID,
              type: orgType
            };

            if (orgName) {
              organisationToAdd.name = orgName;
            } else {
              organisationToAdd.name = orgID;
            }

            $scope.organisations.push(organisationToAdd);
          }
        }

        // Publications
        $scope.journalPapers    = journalCount;
        $scope.externalPapers   = externalConferencePaperCount;
        $scope.patents          = patentCount;
        $scope.internalPapers   = internalConferencePaperCount;
        $scope.technicalReports = technicalReportCount;
        $scope.otherDocuments   = otherCount;
        $scope.totalExternalPublications = externalDocumentCount;
        $scope.totalInternalPublications = internalDocumentCount;

        $scope.pieData = [{
          label: types[$scope.journalType],
          value: $scope.journalPapers
        }, {
          label: types[$scope.externalConferenceType],
          value: $scope.externalPapers
        }, {
          label: types[$scope.patentType],
          value: $scope.patents
        }, {
          label: types[$scope.internalConferenceType],
          value: $scope.internalPapers
        }, {
          label: types[$scope.technicalReportType],
          value: $scope.technicalReports
        }, {
          label: types[$scope.otherDocumentType],
          value: $scope.otherDocuments
        }];

        // citations
        $scope.scholarLink = "https://scholar.google.co.uk/scholar?q=" + properties[ce.author.fullName][0] + "&btnG=&hl=en&as_sdt=0%2C5";

        if (relatedInstances[googleCitationCount]) {
          var googleCitationCountProperties = relatedInstances[googleCitationCount].property_values;

          // local and google citation count && h-index
          var url = utils.getProperty(googleCitationCountProperties, ce.citation.url);
          var googleCount = utils.getIntProperty(googleCitationCountProperties, ce.citation.count);
          var googleHIndex = utils.getIntProperty(googleCitationCountProperties, ce.citation.hIndex);

          $scope.citationCount = {
            url: url,
            count: localCitationCount
          };
          $scope.hIndex = {
            url: url,
            index: localHIndex
          };
          $scope.googleCitationCount = {
            url: url,
            count: googleCount
          };
          $scope.googleHIndex = {
            url: url,
            index: googleHIndex
          };
        }

        var i, j;
        // papers
        $scope.papersList = [];
        var documentMap = {};
        if (documentList) {
          for (i = 0; i < documentList.length; ++i) {
            var paperId   = documentList[i];
            var paper     = relatedInstances[paperId];
            var paperType = utils.getType(paper.concept_names);
            var paperProps = paper.property_values;

            // paper properties
            var paperTitle    = utils.getUnknownProperty(paperProps, ce.paper.title);
            var paperVenue    = utils.getUnknownProperty(paperProps, ce.paper.venue);
            var paperWeight   = utils.getIntProperty(paperProps, ce.paper.weight);
            var paperFinalDate  = utils.getDateProperty(paperProps, ce.paper.finalDate);
            var paperNoteworthy = utils.getProperty(paperProps, ce.paper.noteworthyReason);
            var paperVariantList = utils.getListProperty(paperProps, ce.paper.variantList);
            var paperCitationCount = utils.getIntProperty(paperProps, ce.paper.citationCount);
            var paperFullAuthorString = utils.getUnknownProperty(paperProps, ce.paper.fullAuthorString);

            if (!documentMap[paperId]) {
              var variantFound = false;
              var maxCitations = 0;

              // find max variant
              if (paperVariantList) {
                for (j = 0; j < paperVariantList.length; ++j) {
                  var variantId = paperVariantList[j];

                  if (documentMap[variantId]) {
                    maxCitations = documentMap[variantId].citations > maxCitations ? documentMap[variantId].citations : maxCitations;
                    variantFound = variantId;
                  }
                }
              }

              // set citation count in map
              if (!variantFound) {
                documentMap[paperId] = {
                  citations:  paperCitationCount,
                  index:      i,
                  title:      paperTitle,
                  noteworthy: paperNoteworthy,
                  date:       paperFinalDate,
                  types:      [paperType],
                  venue:      paperVenue,
                  authors:    paperFullAuthorString,
                  weight:     paperWeight
                };
              } else {
                if (maxCitations < paperCitationCount) {
                  var variantTypes = documentMap[variantFound].types.slice();
                  documentMap[variantFound] = null;
                  documentMap[paperId] = {
                    citations: paperCitationCount,
                    index:      i,
                    title:      paperTitle,
                    noteworthy: paperNoteworthy,
                    date:       paperFinalDate,
                    types:      [paperType].concat(variantTypes),
                    venue:      paperVenue,
                    authors:    paperFullAuthorString,
                    weight:     paperWeight
                  };
                } else {
                  documentMap[variantFound].types.push(paperType);
                }
              }
            }
          }

          // recreate array - test for index to remove duplicate citations
          for (i = 0; i < documentList.length; ++i) {
            var thisPaperId = documentList[i];
            var thisPaper = documentMap[thisPaperId];

            if (thisPaper && thisPaper.index === i) {
              var paperItem = {
                id:         thisPaperId,
                name:       thisPaper.title,
                noteworthy: thisPaper.noteworthy,
                date:       thisPaper.date,
                citations:  thisPaper.citations,
                type:       utils.sortTypes(thisPaper.types),
                venue:      thisPaper.venue,
                authors:    thisPaper.authors,
                weight:     thisPaper.weight,
                class:      []
              };

              for (j = 0; j < paperItem.type.length; ++j) {
                paperItem.class.push(utils.getClassName(paperItem.type[j]));
              }

              $scope.papersList.push(paperItem);
            }
          }
        }

        // co-authors
        $scope.coauthorsList = [];
        $scope.nodes = [];

        $scope.nodes.push({
          id:   $scope.authorId,
          name: $scope.author,
          group: $scope.type,
          count: $scope.totalPublications
        });

        if (coAuthorStatistic) {
          for (i = 0; i < coAuthorStatistic.length; ++i) {
            var statId = coAuthorStatistic[i];
            var coAuthorStatProps = relatedInstances[statId].property_values;
            // co-author statistic properties
            var coAuthorId = utils.getListProperty(coAuthorStatProps, ce.statistic.coAuthorList)[0];
            var statCoAuthorCount = utils.getIntProperty(coAuthorStatProps, ce.statistic.coAuthorCount);
//            var coAuthorId = statCoAuthorList[0] === $scope.authorId ? statCoAuthorList[1] : statCoAuthorList[0];

            // co-author properties
            var coAuthorProps = relatedInstances[coAuthorId].property_values;
            var coAuthorName = utils.getUnknownProperty(coAuthorProps, ce.author.fullName);
            var coAuthorEmployer = utils.getProperty(coAuthorProps, ce.author.writesFor);
            var coAuthorCoAuthorList = utils.getListProperty(coAuthorProps, ce.author.coAuthorStatistic);
            var coAuthorType = utils.getIndustryFor(relatedInstances[coAuthorId]);

//            if (coAuthorEmployer && relatedInstances[coAuthorEmployer]) {
//              var employer = relatedInstances[coAuthorEmployer];
//              var employerProps = employer.property_values;
//              coAuthorType = utils.getIndustryFor(employer);
//            }

            $scope.coauthorsList.push({
              id:     coAuthorId,
              name:   coAuthorName,
              count:  statCoAuthorCount
            });

            // build co-co-authors stats
            var coCoAuthorStats = [];

            // remove root author's stats
            for (j in coAuthorCoAuthorList) {
              if (coAuthorCoAuthorList.hasOwnProperty(j)) {
                var coCoAuthorStatProps = relatedInstances[coAuthorCoAuthorList[j]].property_values;

                // co-author co-author properties
                var coCoAuthorCoAuthorList = utils.getListProperty(coCoAuthorStatProps, ce.author.coAuthorList);
                var coCoAuthorCoAuthorCount = utils.getIntProperty(coCoAuthorStatProps, ce.author.coAuthorCount);

                var found = false;
                for (var k in coCoAuthorCoAuthorList) {
                  if (coCoAuthorCoAuthorList[k] === $scope.authorId) {
                    found = true;
                  }
                }

                if (!found) {
                  coCoAuthorStats.push({
                    id:       coAuthorCoAuthorList[j],
                    authors:  coCoAuthorCoAuthorList,
                    count:    coCoAuthorCoAuthorCount
                  });
                }
              }
            }

            $scope.nodes.push({
              id:   coAuthorId,
              name: coAuthorName,
              group: coAuthorType,
              count: statCoAuthorCount,
              links: coCoAuthorStats
            });
          }
        }

        // Draw charts
        if ($scope.currentView === $scope.views[0]) {
          drawNarrativeChart($stateParams.authorId, true, false, false, data, urls.server, urls.ceStore, $scope.scienceLibrary, utils, ce);
        }

//        generateCSVData();
        refreshHighlight();

        $scope.showView($scope.views[0]);
          });
        });
      });

    var mergeResponses = function(dm, dp, dc) {
      var result = {};

      result.main_instance = dm.main_instance;
      result.related_instances = [];

      for (var i in dm.related_instances) {
        var relInst = dm.related_instances[i];
        result.related_instances[i] = relInst;
      }

      for (var i in dp.related_instances) {
        var relInst = dp.related_instances[i];
        result.related_instances[i] = relInst;
      }

      for (var i in dp.main_instance.property_values) {
        var pv = dp.main_instance.property_values[i];
       result.main_instance.property_values[i] = pv;
      }

      for (var i in dc.related_instances) {
        var relInst = dc.related_instances[i];

        if (relInst.concept_names.indexOf(ce.concepts.coAuthorStatistic) > -1) {
          result.related_instances[i] = relInst;
        }

        if (relInst.concept_names.indexOf(ce.concepts.person) > -1) {
            result.related_instances[i] = relInst;
          }
      }

      for (var i in dc.main_instance.property_values) {
          var pv = dc.main_instance.property_values[i];
         result.main_instance.property_values[i] = pv;
        }

//      debugTypes(dm, "main");
//      debugTypes(dp, "papers");
//      debugTypes(dc, "co-authors");
//      debugTypes(result, "merged");

//      console.log("merged");
//      console.log(result);

      return result;
    };

//    var debugTypes = function(data, name) {
//        var types = {
//                document: [],
//                person: [],
//                organisation: [],
//                topic: [],
//                date: [],
//                cas: [],
//                oas: [],
//                other: []
//              };
//
//              for (var i in data.related_instances) {
//                var thisInst = data.related_instances[i];
//
//                if (thisInst.concept_names.indexOf(ce.concepts.document) > -1) {
//                  types.document.push(thisInst);
//                } else if (thisInst.concept_names.indexOf(ce.concepts.person) > -1) {
//                  types.person.push(thisInst);
//                } else if (thisInst.concept_names.indexOf(ce.concepts.organisation) > -1) {
//                  types.organisation.push(thisInst);
//                } else if (thisInst.concept_names.indexOf(ce.concepts.topic) > -1) {
//                  types.topic.push(thisInst);
//                } else if (thisInst.concept_names.indexOf(ce.concepts.date) > -1) {
//                  types.date.push(thisInst);
//                } else if (thisInst.concept_names.indexOf(ce.concepts.coAuthorStatistic) > -1) {
//                  types.cas.push(thisInst);
//                } else if (thisInst.concept_names.indexOf(ce.concepts.orderedAuthor) > -1) {
//                  types.oas.push(thisInst);
//                } else {
//                  types.other.push(thisInst);
//                }
//              }
//console.log(name);
//console.log("  documents: " + types.document.length);
//console.log("  people: " + types.person.length);
//console.log("  organisations: " + types.organisation.length);
//console.log("  topics: " + types.topic.length);
//console.log("  dates: " + types.date.length);
//console.log("  co-author statistics: " + types.cas.length);
//console.log("  ordered authors: " + types.oas.length);
//console.log("  others: " + types.other.length);
//              };
  }]
  );
