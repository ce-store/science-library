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
    $scope.journalType = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType = documentTypes.technical;
    $scope.otherDocumentType = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = true;

    $scope.sortTypes = {
      papers: {
        names: ['most collaborative', 'citation count', 'most recent', 'name'],
        values: ['weight', 'citationCount', 'date', 'name'],
        show: [false, true, false, false],
        reverse: ['-', '-', '-', '+']
      },
      authors: {
        names: ['external paper count', 'ITA citation count', 'ITA h-index', 'co-author count', 'name'],
        values: ['externalCount', 'citationCount', 'hIndex', 'coAuthorCount', 'name'],
        show: [true, true, true, true, false],
        reverse: ['-', '-', '-', '-', '+']
      },
      organisations: {
        names: ['authors', 'paper count', 'citation count', 'name'],
        values: ['authorCount', 'paperCount', 'citationCount', 'name'],
        show: [true, true, true, false],
        reverse: ['-', '-', '-', '+']
      },
    };

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

      if (view === $scope.views[0]) {
        $scope.sort = $scope.sortTypes.papers;
        $scope.header = $scope.papersHeader;
      } else if (view === $scope.views[1]) {
        $scope.sort = $scope.sortTypes.authors;
        $scope.header = $scope.authorsHeader;
      } else if (view === $scope.views[2]) {
        $scope.sort = $scope.sortTypes.organisations;
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

        $scope.authorsHeader = 'Authors who wrote about ' + $scope.name;
        $scope.papersHeader = 'Papers about ' + $scope.name;
        $scope.orgsHeader = 'Organisations who wrote about ' + $scope.name;

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
                  title: paperProps.title ? paperProps.title[0] : unknown,
                  citations: citations,
                  date: paperProps["final date"] ? Date.parse(paperProps["final date"][0]) : 0,
                  types: [paperType],
                  weight: paperProps.weight ? paperProps.weight[0] : -1
                };
              } else {
                if (maxCitations < citations) {
                  var variantTypes = documentMap[variantFound].types.slice();
                  documentMap[variantFound] = null;
                  documentMap[id] = {
                    title: paperProps.title ? paperProps.title[0] : unknown,
                    citations: citations,
                    date: paperProps["final date"] ? Date.parse(paperProps["final date"][0]) : 0,
                    types: [paperType].concat(variantTypes),
                    weight: paperProps.weight ? paperProps.weight[0] : -1
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

              var authorName = authorProps["full name"] ? authorProps["full name"][0] : id;
              var totalExternalCount = authorProps["external document count"] ? parseInt(authorProps["external document count"][0], 10) : 0;
              var citationCount = authorProps["local citation count"] ? authorProps["local citation count"][0] : 0;
              var hIndex = authorProps["local h-index"] ? authorProps["local h-index"][0] : 0;
              var coAuthorCount = authorProps["co-author count"] ? authorProps["co-author count"][0] : 0;

              $scope.authors.push({
                id: author,
                name: authorName,
                externalCount: parseInt(totalExternalCount, 10),
                citationCount: parseInt(citationCount, 10),
                hIndex: parseInt(hIndex, 10),
                coAuthorCount: parseInt(coAuthorCount, 10)
              });
            }
          } else if (instance.direct_concept_names.indexOf("topic-organisation statistic") > -1) {
            topicProps = instance.property_values;
            var org = topicProps.organisation ? topicProps.organisation[0] : unknown;

            if (org !== unknown) {
              var orgProps = relatedInstances[org].property_values;

              var name = orgProps["name"] ? orgProps["name"][0] : id;
              var paperCount = orgProps["document count"] ? orgProps["document count"][0] : 0;
              var authorCount = orgProps["employs"] ? orgProps["employs"].length : 0;
              var orgCitationCount = orgProps["citation count"] ? orgProps["citation count"][0] : 0;

              $scope.organisations.push({
                id: org,
                name: name,
                authorCount: parseInt(authorCount, 10),
                paperCount: parseInt(paperCount, 10),
                citationCount: parseInt(orgCitationCount, 10)
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
            date: doc.date,
            citationCount: parseInt(doc.citations, 10),
            type: utils.sortTypes(doc.types),
            class: [],
            weight: parseInt(doc.weight, 10)
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

        $scope.showView($scope.views[0]);
      });
  }]);
