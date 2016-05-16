'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:TopicCtrl
 * @description
 * # TopicCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('TopicCtrl', ['$scope', '$stateParams', 'store', 'hudson', 'documentTypes', 'utils', 'csv', function ($scope, $stateParams, store, hudson, documentTypes, utils, csv) {
    $scope.views = ['papers', 'authors', 'organisations'];
    $scope.currentView = $scope.views[0];
    $scope.journalType = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType = documentTypes.technical;
    $scope.otherDocumentType = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = true;

    var unknown = "Unknown";
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
        var markersArray = properties.marker ? properties.marker : [];
        $scope.markers = "";

        // Add markers to name
        if (markersArray.length > 1) {
          for (var i = 1; i < markersArray.length; ++i) {
            $scope.markers += markersArray[i];

            if (i < markersArray.length - 1) {
              $scope.markers += ", ";
            }
          }
        }

        // Sort through documents to find variants
        $scope.authors = [];
        $scope.organisations = [];
        var topicProps;
        for (var id in relatedInstances) {
          var instance = relatedInstances[id];

          if (instance.direct_concept_names.indexOf("document") > -1) {
            var paperProps = instance.property_values;
            var citations = 0;

            if (!documentMap[id]) {
              var variantFound = false;
              var maxCitations = 0;

              // find max variant
              if (paperProps.variant) {
                for (var j = 0; j < paperProps.variant.length; ++j) {
                  var variantId = paperProps.variant[j];

                  if (documentMap[variantId] && documentMap[variantId].citations > maxCitations) {
                    maxCitations = documentMap[variantId].citations;
                    variantFound = variantId;
                  }
                }
              }

              // get citation count for paper
              var citationId = paperProps["citation count"] ? paperProps["citation count"][0] : null;
              if (citationId) {
                var citationProps = relatedInstances[citationId].property_values;
                citations = citationProps["citation count"] ? citationProps["citation count"][0] : 0;
              }

              // get paper type and collapse variants
              var paperType = utils.getType(instance.direct_concept_names);
              if (!variantFound) {
                documentMap[id] = {
                  citations: citations,
                  title: paperProps.title ? paperProps.title[0] : unknown,
                  types: [paperType],
                };
              } else {
                if (maxCitations < citations) {
                  var variantTypes = documentMap[variantFound].types.slice();
                  documentMap[variantFound] = null;
                  documentMap[id] = {
                    citations: citations,
                    title: paperProps.title ? paperProps.title[0] : unknown,
                    types: [paperType].concat(variantTypes),
                  };
                } else {
                  documentMap[variantFound].types.push(paperType);
                }
              }
            }
          } else if (instance.direct_concept_names.indexOf("topic-person statistic") > -1) {
            topicProps = instance.property_values;
            var author = topicProps.person ? topicProps.person[0] : unknown;
            var authorDocs = topicProps.document.length;

            if (author !== unknown) {
              var authorProps = relatedInstances[author].property_values;

              $scope.authors.push({
                id: author,
                name: authorProps["full name"] ? authorProps["full name"][0] : id,
                papers: authorDocs
              });
            }
          } else if (instance.direct_concept_names.indexOf("topic-organisation statistic") > -1) {
            topicProps = instance.property_values;
            var org = topicProps.organisation ? topicProps.organisation[0] : unknown;
            var orgDocs = topicProps.document.length;

            if (org !== unknown) {
              var orgProps = relatedInstances[org].property_values;

              $scope.organisations.push({
                id: org,
                name: orgProps["name"] ? orgProps["name"][0] : id,
                papers: orgDocs
              });
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
          var doc = documentMap[docId];
          var paperItem = {
            id: docId,
            name: doc.title,
            citations: parseInt(doc.citations, 10),
            type: utils.sortTypes(doc.types),
            class: []
          };

          for (var k = 0; k < paperItem.type.length; ++k) {
            var type = paperItem.type[k];

            $scope.paperCounts[documentTypes.typeMap[type]]++;
            paperItem.class.push(utils.getClassName(type));
            csvData.push([doc.id, doc.title, type]);
          }

          $scope.publications.push(paperItem);
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
      });
  }]);
