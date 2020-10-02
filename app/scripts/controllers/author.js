/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals window: true */
/* globals drawNarrativeChart: true */

angular.module('slApp')

.controller('AuthorCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'store', 'urls', 'hudson', 'documentTypes', 'utils', 'csv', 'colours', 'definitions', function ($scope, $state, $stateParams, $timeout, store, urls, hudson, documentTypes, utils, csv, colours, ce) {
  'use strict';

  var dataMain = null;
  var dataPapers = null;
  var dataCoAuthors = null;

  $scope.views = ['narrative', 'papers', 'co-authors', 'network'];
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
      show:     [false, true, true, false],
      reverse:  ['-', '-', '-', '+']
    },
    coAuthors: {
      names:    ['shared paper count', 'name'],
      values:   ['count', 'name'],
      show:     [true, false],
      reverse:  ['-', '+']
    }
  };

  $scope.formatSortValue = function(rawVal, sortName) {
    return utils.formatSortValue(rawVal, sortName);
  };

  var lastHighlight = null;
  var types = documentTypes.nameMap;

  $scope.$on('question:added', function() {
    refreshHighlight();
  });

  $scope.showView = function (view) {
    $scope.currentView = view;
    //$stateParams.view = view;
    $state.go('author', $stateParams);

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
      store.getAuthorPapers($stateParams.authorId)
      .then(function(dp) {
        dataPapers = dp;
        store.getAuthorCoAuthors($stateParams.authorId)
          .then(function(dc) {
          dataCoAuthors = dc;

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
      var citationCount = utils.getProperty(properties, ce.author.citationCount);
      var googleCitationCount = utils.getIntProperty(properties, ce.author.overallCitationCount);
      var localCitationCount = utils.getIntProperty(properties, ce.author.localCitationCount);
      var googleHIndex = utils.getIntProperty(properties, ce.author.overallHIndex);
      var localHIndex = utils.getIntProperty(properties, ce.author.localHIndex);
      var writesFor = utils.getListProperty(properties, ce.author.writesFor);
      var writesAbout = utils.getUnknownProperty(properties, ce.author.writesAbout);
      var coAuthorStatistic = utils.getListProperty(properties, ce.author.coAuthorStatistic);
      var topicPersonStatistic = utils.getListProperty(properties, ce.author.topicPersonStatistic);
      var profilePic = utils.getProperty(properties, ce.author.profilePicture);

      // Set data
      $scope.authorId = $stateParams.authorId;
      $scope.author = fullName;
      $scope.profilePic = profilePic;
      $scope.type = utils.getIndustryFor(data.main_instance);
      $scope.coAuthorsHeader = $scope.author + "'s co-authors";
      $scope.papersHeader = $scope.author + "'s papers";

      // Organisations
      $scope.organisations = [];

      if (writesFor != null) {
        var i, j;
        for (i = 0; i < writesFor.length; ++i) {
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

      if (relatedInstances[citationCount]) {
        var googleCitationCountProperties = relatedInstances[citationCount].property_values;

        // local and google citation count && h-index
        var url = utils.getProperty(googleCitationCountProperties, ce.citation.url);

        $scope.citationCount = {
          count: localCitationCount
        };
        $scope.hIndex = {
          index: localHIndex
        };
        $scope.googleCitationCount = {
          url: url,
          count: googleCitationCount
        };
        $scope.googleHIndex = {
          index: googleHIndex
        };
      }

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
          var noteworthyReason = utils.getProperty(paperProps, ce.paper.noteworthyReason);
          var noteworthyUrl = utils.getProperty(paperProps, ce.paper.noteworthyUrl);
          var paperVariantList = utils.getListProperty(paperProps, ce.paper.variantList);
          var paperFullAuthorString = utils.getUnknownProperty(paperProps, ce.paper.fullAuthorString);
          var paperCitationCount = null;

          for (var j = 0; j < paperProps[ce.paper.googleCitationCount].length; ++j) {
            var cName = paperProps[ce.paper.googleCitationCount][j];

            if (cName != null) {
              var citation = relatedInstances[cName];

              if (citation != null) {
                if (utils.isConcept(citation, ce.concepts.latestPaperCitationCount)) {
                  paperCitationCount = utils.getIntProperty(citation.property_values, ce.citation.count);
                }
              }
            }
          }

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
                noteworthyReason: noteworthyReason,
                noteworthyUrl: noteworthyUrl,
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
                  noteworthyReason: noteworthyReason,
                  noteworthyUrl: noteworthyUrl,
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
              noteworthy: thisPaper.noteworthyReason,
              url:        thisPaper.noteworthyUrl,
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
          var coAuthorId = utils.getListProperty(coAuthorStatProps, ce.statistic.coAuthorList)[0];
          var statCoAuthorCount = utils.getIntProperty(coAuthorStatProps, ce.statistic.coAuthorCount);

          // co-author properties
          var coAuthorProps = relatedInstances[coAuthorId].property_values;
          var coAuthorName = utils.getUnknownProperty(coAuthorProps, ce.author.fullName);
          var coAuthorEmployer = utils.getProperty(coAuthorProps, ce.author.writesFor);
          var coAuthorCoAuthorList = utils.getListProperty(coAuthorProps, ce.author.coAuthorStatistic);
          var coAuthorType = utils.getIndustryFor(relatedInstances[coAuthorId]);

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

      refreshHighlight();

      if ($stateParams.view && $scope.views.includes($stateParams.view)) {
        $scope.showView($stateParams.view);
      } else {
        $scope.showView($scope.views[0]);
      }
      });
    });
  });

  var mergeResponses = function(dm, dp, dc) {
    var result = {};

    result.main_instance = dm.main_instance;
    result.related_instances = [];

    var k, relInst, pv;
    for (k in dm.related_instances) {
      relInst = dm.related_instances[k];
      result.related_instances[k] = relInst;
    }

    for (k in dp.related_instances) {
      relInst = dp.related_instances[k];
      result.related_instances[k] = relInst;
    }

    for (k in dp.main_instance.property_values) {
      pv = dp.main_instance.property_values[k];
     result.main_instance.property_values[k] = pv;
    }

    for (k in dc.related_instances) {
      relInst = dc.related_instances[k];

      if (relInst.concept_names.indexOf(ce.concepts.coAuthorStatistic) > -1) {
        result.related_instances[k] = relInst;
      }

      if (relInst.concept_names.indexOf(ce.concepts.person) > -1) {
        result.related_instances[k] = relInst;
      }
    }

    for (k in dc.main_instance.property_values) {
      pv = dc.main_instance.property_values[k];
      result.main_instance.property_values[k] = pv;
    }

    return result;
  };
}]);
