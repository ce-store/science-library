'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:ProjectCtrl
 * @description
 * # ProjectCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('ProjectCtrl', ['$scope', '$stateParams', 'store', 'hudson', 'documentTypes', 'utils', 'csv', 'urls', function ($scope, $stateParams, store, hudson, documentTypes, utils, csv, urls) {
    $scope.scienceLibrary = urls.scienceLibrary;
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

    // set max-height of publication list
    var publicationsListElem = angular.element("#publications-results-list");
    var maxHeight = $scope.height - 335;
    publicationsListElem.css("max-height", maxHeight + "px");

    store.getProject($stateParams.projectId)
      .then(function(data) {
        var properties = data.main_instance.property_values;
        var relatedInstances = data.related_instances;
        var documentMap = {};
//        var csvData = [];

        // Set properties
        $scope.name = properties.name ? properties.name[0] : unknown;
        $scope.technicalArea = properties["technical area"] ? relatedInstances[properties["technical area"][0]].property_values.name[0] : unknown;
        $scope.publications = [];

        if (properties.paper) {
          var i, j;
          for (i = 0; i < properties.paper.length; ++i) {
            var paperId = properties.paper[i];
            var paperInst = relatedInstances[paperId];
            var paperProps = paperInst.property_values;
            var paperType = utils.getType(paperInst.direct_concept_names || paperInst.concept_names);

            var citationsId = paperInst.property_values["citation count"];
            var citations = 0;

            if (!documentMap[paperId]) {
              var variantFound = false;
              var maxCitations = 0;

              // find max variant
              if (paperProps.variant) {
                for (j = 0; j < paperProps.variant.length; ++j) {
                  var variantId = paperProps.variant[j];

                  if (documentMap[variantId]) {
                    maxCitations = documentMap[variantId].citations > maxCitations ? documentMap[variantId].citations : maxCitations;
                    variantFound = variantId;
                  }
                }
              }

              if (citationsId) {
                var citationProps = relatedInstances[citationsId[0]].property_values;
                citations = citationProps["citation count"] ? parseInt(citationProps["citation count"][0], 10) : 0;

                if (!variantFound) {
                  documentMap[paperId] = {
                    citations: citations,
                    index: i,
                    title: paperProps.title ? paperProps.title[0] : unknown,
                    types: [paperType],
                    venue: paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"][0] : ""),
                    authors: paperProps["original authors string"] ? paperProps["original authors string"][0] : ""
                  };
                } else {
                  if (maxCitations < citations) {
                    var variantTypes = documentMap[variantFound].types.slice();
                    documentMap[variantFound] = null;
                    documentMap[paperId] = {
                      citations: citations,
                      index: i,
                      title: paperProps.title ? paperProps.title[0] : unknown,
                      types: [paperType].concat(variantTypes),
                      venue: paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"][0] : ""),
                      authors: paperProps["original authors string"] ? paperProps["original authors string"][0] : ""
                    };
                  } else {
                    documentMap[variantFound].types.push(paperType);
                  }
                }
              }
            }
          }

          // recreate array - test for index to remove duplicate citations
          for (i = 0; i < properties.paper.length; ++i) {
            var thisPaperId = properties.paper[i];
            var thisPaper = documentMap[thisPaperId];

            if (thisPaper && thisPaper.index === i) {
              var paperItem = {
                id: thisPaperId,
                name: thisPaper.title,
                citations: thisPaper.citations,
                type: utils.sortTypes(thisPaper.types),
                venue: thisPaper.venue,
                authors: thisPaper.authors,
                class: []
              };

//              for (j = 0; j < paperItem.type.length; ++j) {
//                paperItem.class.push(utils.getClassName(paperItem.type[j]));
//                csvData.push([paperItem.id, paperItem.name, paperItem.value, paperItem.type[j], paperItem.venue, paperItem.authors]);
//              }

              $scope.publications.push(paperItem);
            }
          }
        }

//        csv.setData(csvData);
//        csv.setHeader(["paper id", "paper name", "citation count", "paper type", "venue", "authors"]);
//        csv.setName($stateParams.projectId);

        refreshHighlight();
      });
  }]);
