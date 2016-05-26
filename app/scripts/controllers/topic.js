'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:TopicCtrl
 * @description
 * # TopicCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('TopicCtrl', ['$scope', '$stateParams', 'store', 'hudson', 'documentTypes', 'utils', 'csv', 'urls', 'definitions', function ($scope, $stateParams, store, hudson, documentTypes, utils, csv, urls, ce) {
    $scope.views = ['papers', 'authors', 'organisations'];
    $scope.scienceLibrary = urls.scienceLibrary;
    $scope.journalType            = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType    = documentTypes.technical;
    $scope.otherDocumentType      = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = true;

    $scope.sortTypes = {
      papers: {
        names:    ['most collaborative', 'citation count', 'most recent', 'name'],
        values:   ['weight', 'citationCount', 'date', 'name'],
        show:     [false, true, false, false],
        reverse:  ['-', '-', '-', '+']
      },
      authors: {
        names:    ['external paper count', 'ITA citation count', 'ITA h-index', 'co-author count', 'name'],
        values:   ['externalCount', 'citationCount', 'hIndex', 'coAuthorCount', 'name'],
        show:     [true, true, true, true, false],
        reverse:  ['-', '-', '-', '-', '+']
      },
      organisations: {
        names:    ['authors', 'paper count', 'citation count', 'name'],
        values:   ['authorCount', 'paperCount', 'citationCount', 'name'],
        show:     [true, true, true, false],
        reverse:  ['-', '-', '-', '+']
      },
    };

    var lastHighlight;
    var types = documentTypes.nameMap;

    $scope.$on('question:added', function() {
      refreshHighlight();
    });

    var refreshHighlight = function() {
      var qa = hudson.getLatestQuestion();

      if (lastHighlight) {
        $scope[lastHighlight] = false;
      }

      if (qa && qa.type === 'highlight') {
        $scope[qa.property + 'Highlight'] = true;
        lastHighlight = qa.property + 'Highlight';
      }
    };

    $scope.showView = function (view) {
      $scope.currentView = view;

      if (view === $scope.views[0]) {
        $scope.sort   = $scope.sortTypes.papers;
        $scope.header = $scope.papersHeader;
      } else if (view === $scope.views[1]) {
        $scope.sort   = $scope.sortTypes.authors;
        $scope.header = $scope.authorsHeader;
      } else if (view === $scope.views[2]) {
        $scope.sort   = $scope.sortTypes.organisations;
        $scope.header = $scope.orgsHeader;
      }
      // generateCSVData();
    };

    $scope.filterPapers = function(value) {
      if (typeof value.type !== 'undefined') {
        return ($scope.journalInput &&
            value.type.indexOf(types[$scope.journalType]) > -1) ||
          ($scope.externalInput &&
            value.type.indexOf(types[$scope.externalConferenceType]) > -1) ||
          ($scope.internalInput &&
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

    var height = $scope.height - 215;

    // set height of publications list
    var elem = angular.element("#publications-results-list");
    elem.css("height", height + "px");
    elem.css("max-height", height + "px");

    elem = angular.element("#publications-results-list .results-list");
    elem.css("height", "calc(100% - 50px)");

    // set height of authors list
    elem = angular.element("#authors-results-list");
    elem.css("height", height + "px");
    elem.css("max-height", height + "px");

    elem = angular.element("#authors-results-list .results-list");
    elem.css("height", "calc(100% - 50px)");

    // set height of organisations list
    elem = angular.element("#orgs-results-list");
    elem.css("height", height + "px");
    elem.css("max-height", height + "px");

    elem = angular.element("#orgs-results-list .results-list");
    elem.css("height", "calc(100% - 50px)");

    store.getTopic($stateParams.topicId)
      .then(function(data) {
        var properties = data.main_instance.property_values;
        var relatedInstances = data.related_instances;
        var documentMap = {};
        var csvData = [];

        $scope.name = $stateParams.topicId;

        // topic properties
        var markersList = utils.getListProperty(properties, ce.topic.markerList);
        $scope.markers = "";

        // Add markers to name
        if (markersList && markersList.length > 1) {
          for (var i = 1; i < markersList.length; ++i) {
            $scope.markers += markersList[i];

            if (i < markersList.length - 1) {
              $scope.markers += ", ";
            }
          }
        }

        $scope.authorsHeader  = 'Authors who wrote about ' + $scope.name;
        $scope.papersHeader   = 'Papers about ' + $scope.name;
        $scope.orgsHeader     = 'Organisations who wrote about ' + $scope.name;

        // Sort through documents to find variants
        $scope.authors = [];
        $scope.organisations = [];
        var topicProps;

        for (var id in relatedInstances) {
          if (relatedInstances.hasOwnProperty(id)) {
            var instance = relatedInstances[id];

            if (instance.direct_concept_names.indexOf("document") > -1) {
              var paperProps = instance.property_values;

              // paper properties
              var paperName   = utils.getUnknownProperty(paperProps, ce.paper.title);
              var paperWeight = utils.getIntProperty(paperProps, ce.paper.weight);
              var paperFinalDate = utils.getDateProperty(paperProps, ce.paper.finalDate);
              var paperCitationCount = utils.getIntProperty(paperProps, ce.paper.citationCount);
              var paperVariantList = utils.getListProperty(paperProps, ce.paper.variantList);

              if (!documentMap[id]) {
                var variantFound = false;
                var maxCitations = 0;

                // find max variant
                if (paperVariantList) {
                  for (var j = 0; j < paperVariantList.length; ++j) {
                    var variantId = paperVariantList[j];

                    if (documentMap[variantId] && documentMap[variantId].citations > maxCitations) {
                      maxCitations = documentMap[variantId].citations;
                      variantFound = variantId;
                    }
                  }
                }

                // get paper type and collapse variants
                var paperType = utils.getType(instance.direct_concept_names);
                if (!variantFound) {
                  documentMap[id] = {
                    title:      paperName,
                    citations:  paperCitationCount,
                    date:       paperFinalDate,
                    types:      [paperType],
                    weight:     paperWeight
                  };
                } else {
                  if (maxCitations < paperCitationCount) {
                    var variantTypes = documentMap[variantFound].types.slice();
                    documentMap[variantFound] = null;
                    documentMap[id] = {
                      title:      paperName,
                      citations:  paperCitationCount,
                      date:       paperFinalDate,
                      types:      [paperType].concat(variantTypes),
                      weight:     paperWeight
                    };
                  } else {
                    documentMap[variantFound].types.push(paperType);
                  }
                }
              }
            } else if (instance.direct_concept_names.indexOf("topic-person statistic") > -1) {
              topicProps = instance.property_values;

              // topic-person statistic properties
              var topicStatAuthor = utils.getProperty(topicProps, ce.statistic.person);
              var topicStatDocumentList = utils.getListProperty(topicProps, ce.statistic.documentList);

              if (topicStatAuthor) {
                var authorProps = relatedInstances[topicStatAuthor].property_values;

                // author properties
                var authorName = utils.getProperty(authorProps, ce.author.fullName);
                var authorExternalCount = utils.getIntProperty(authorProps, ce.author.externalDocumentCount);
                var authorCitationCount = utils.getIntProperty(authorProps, ce.author.localCitationCount);
                var authorHIndex = utils.getIntProperty(authorProps, ce.author.localHIndex);
                var authorCoAuthorCount = utils.getIntProperty(authorProps, ce.author.coAuthorCount);

                if (!authorName) {
                  authorName = topicStatAuthor;
                }

                $scope.authors.push({
                  id:   topicStatAuthor,
                  name: authorName,
                  externalCount:  authorExternalCount,
                  citationCount:  authorCitationCount,
                  hIndex:         authorHIndex,
                  coAuthorCount:  authorCoAuthorCount
                });
              }
            } else if (instance.direct_concept_names.indexOf("topic-organisation statistic") > -1) {
              topicProps = instance.property_values;

              // topic-organisation statistic properties
              var topicStatOrg = utils.getProperty(topicProps, ce.statistic.organisation);

              if (topicStatOrg) {
                var orgProps = relatedInstances[topicStatOrg].property_values;

                // organisation properties
                var orgName = utils.getProperty(orgProps, ce.organisation.name);
                var orgDocumentCount = utils.getIntProperty(orgProps, ce.organisation.documentCount);
                var orgEmployeeList = utils.getListProperty(orgProps, ce.organisation.employeeList);
                var orgCitationCount = utils.getIntProperty(orgProps, ce.organisation.citationCount);

                if (!orgName) {
                  orgName = topicStatOrg;
                }

                $scope.organisations.push({
                  id:             topicStatOrg,
                  name:           orgName,
                  paperCount:     orgDocumentCount,
                  authorCount:    orgEmployeeList.length,
                  citationCount:  orgCitationCount
                });
              }
            }
          }
        }

        // Initialise paper counts
        $scope.paperCounts = {
          journal: 0,
          external: 0,
          patent: 0,
          internal: 0,
          technical: 0,
          other: 0
        };

        // Create final publications list
        $scope.publications = [];
        for (var docId in documentMap) {
          if (documentMap.hasOwnProperty(docId)) {
            var doc = documentMap[docId];
            var paperItem = {
              id:   docId,
              name: doc.title,
              date: doc.date,
              citationCount: doc.citations,
              type:   utils.sortTypes(doc.types),
              class:  [],
              weight: doc.weight
            };

            for (var k = 0; k < paperItem.type.length; ++k) {
              var type = paperItem.type[k];

              $scope.paperCounts[documentTypes.typeMap[type]]++;
              paperItem.class.push(utils.getClassName(type));
              csvData.push([doc.id, doc.title, type]);
            }

            $scope.publications.push(paperItem);
          }
        }
        $scope.paperCounts.total = $scope.paperCounts.journal + $scope.paperCounts.external + $scope.paperCounts.patent;

        // Set up pie chart data
        $scope.pieData = [{
          label: types[$scope.journalType],
          value: $scope.paperCounts.journal
        }, {
          label: types[$scope.externalConferenceType],
          value: $scope.paperCounts.external
        }, {
          label: types[$scope.patentType],
          value: $scope.paperCounts.patent
        }, {
          label: types[$scope.internalConferenceType],
          value: $scope.paperCounts.internal
        }, {
          label: types[$scope.technicalReportType],
          value: $scope.paperCounts.technical
        }, {
          label: types[$scope.otherDocumentType],
          value: $scope.paperCounts.other
        }];

        $scope.showView($scope.views[0]);
      });
  }]);
