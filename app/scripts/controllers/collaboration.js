/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals window: true */

angular.module('slApp')

.controller('CollaborationCtrl', ['$scope', '$stateParams', '$q', '$document', 'store', 'utils', 'documentTypes', 'csv', 'colours', 'urls', 'definitions', function ($scope, $stateParams, $q, $document, store, utils, documentTypes, csv, colours, urls, ce) {
  'use strict';

  $scope.views    = ["chart", "list"];
  $scope.scienceLibrary = urls.scienceLibrary;
  $scope.authors  = [];
  $scope.papers   = [];
  $scope.currentView  = $scope.views[0];
  $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = true;

  var types = documentTypes.nameMap;
  var buckets = {};
  var min, max;

  $scope.typeCount = {};
  $scope.typeCount[types[documentTypes.journal]]    = 0;
  $scope.typeCount[types[documentTypes.external]]   = 0;
  $scope.typeCount[types[documentTypes.patent]]     = 0;
  $scope.typeCount[types[documentTypes.internal]]   = 0;
  $scope.typeCount[types[documentTypes.technical]]  = 0;
  $scope.typeCount[types[documentTypes.other]]      = 0;

  // get window size
  $scope.width  = window.innerWidth;
  $scope.height = window.innerHeight;

  var height = $scope.height - 270;

  // set max-height of papers list
  var elem = angular.element("#collaborations-papers-list");
  elem.css("height", (height + 20) + "px");

  elem = angular.element("#collaborations-papers-list .results-list");
  elem.css("max-height", "calc(100% - 75px)");

  $scope.showView = function (view) {
    $scope.currentView = view;
  };

  $scope.filterPapers = function(value) {
    if (typeof value.type !== 'undefined') {
      return ($scope.journalInput &&
          value.type.indexOf(types[documentTypes.journal]) > -1) ||
        ($scope.externalInput &&
          value.type.indexOf(types[documentTypes.external]) > -1) ||
        ($scope.patentInput &&
          value.type.indexOf(types[documentTypes.patent]) > -1) ||
        ($scope.internalInput &&
          value.type.indexOf(types[documentTypes.internal]) > -1) ||
        ($scope.technicalInput &&
          value.type.indexOf(types[documentTypes.technical]) > -1) ||
        ($scope.otherInput &&
          value.type.indexOf(types[documentTypes.other]) > -1);
    }
  };

  var promises = [];
  var i, j;
  // get details for all authors
  for (i = 0; i < $stateParams.author.length; ++i) {
    promises.push(store.getAuthorPapers($stateParams.author[i]));
  }

  $q.all(promises)
    .then(function(results) {
      var documentList = [];

      // find papers written by all authors
      for (i = 0; i < results.length; ++i) {
        var result = results[i];
        var authorId = result.main_instance._id;
        var props = result.main_instance.property_values;

        // author properties
        var name = utils.getProperty(props, ce.author.fullName);

        $scope.authors.push({
          id: authorId,
          name: name
        });

        // papers
        var documentListProperty = utils.getListProperty(props, ce.author.documentList);
        if (i === 0) {
          documentList = documentListProperty;
        } else {
          var deleteIndexes = [];

          for (j = 0; j < documentList.length; ++j) {
            var paper = documentList[j];

            if (documentListProperty) {
              if (documentListProperty.indexOf(paper) < 0) {
                deleteIndexes.push(j);
              }
            }
          }

          for (var k = deleteIndexes.length - 1; k >= 0; --k) {
            documentList.splice(deleteIndexes[k], 1);
          }
        }
      }

      var relatedInstances = results[0].related_instances;
      var documentMap = {};

      // generate papers list with details
      for (i = 0; i < documentList.length; ++i) {
        var paperId = documentList[i];
        var paperType = utils.getType(relatedInstances[paperId].concept_names);
        var paperProps = relatedInstances[paperId].property_values;

        // paper properties
        var paperName     = utils.getProperty(paperProps, ce.paper.title);
        var paperVariants = utils.getListProperty(paperProps, ce.paper.variantList);
        var paperVenue    = utils.getProperty(paperProps, ce.paper.venue);
        var paperWeight   = utils.getIntProperty(paperProps, ce.paper.weight);
        var paperFinalDate = utils.getProperty(paperProps, ce.paper.finalDate);
        var paperCitationCount = utils.getIntProperty(paperProps, ce.paper.citationCount);
        var paperFullAuthorsString = utils.getUnknownProperty(paperProps, ce.paper.fullAuthorsString);
        var noteworthyReason = utils.getProperty(paperProps, ce.paper.noteworthyReason);
        var noteworthyUrl = utils.getProperty(paperProps, ce.paper.noteworthyUrl);
        $scope.typeCount[paperType]++;

        if (!documentMap[paperId]) {
          var variantFound = false;
          var maxCitations = 0;

          // find max variant
          if (paperVariants) {
            for (j = 0; j < paperVariants.length; ++j) {
              var variantId = paperVariants[j];

              if (documentMap[variantId]) {
                maxCitations = documentMap[variantId].citations > maxCitations ? documentMap[variantId].citations : maxCitations;
                variantFound = variantId;
              }
            }
          }

          if (!variantFound) {
            documentMap[paperId] = {
              index:      i,
              title:      paperName,
              citations:  paperCitationCount,
              noteworthy: noteworthyReason,
              url:        noteworthyUrl,
              types:      [paperType],
              venue:      paperVenue,
              authors:    paperFullAuthorsString,
              weight:     paperWeight
            };
          } else {
            if (maxCitations < paperCitationCount) {
              var variantTypes = documentMap[variantFound].types.slice();
              documentMap[variantFound] = null;
              documentMap[paperId] = {
                index:      i,
                title:      paperName,
                citations:  paperCitationCount,
                noteworthy: noteworthyReason,
                url:        noteworthyUrl,
                types:      [paperType].concat(variantTypes),
                venue:      paperVenue,
                authors:    paperFullAuthorsString,
                weight:     paperWeight
              };
            } else {
              documentMap[variantFound].types.push(paperType);
            }
          }
        }

        // get date properties
        if (paperFinalDate) {
          var month = relatedInstances[paperFinalDate].property_values[ce.date.month];
          var year = relatedInstances[paperFinalDate].property_values[ce.date.year];

          if (!month) {
            month = '1';
          }

          // month indexed from 1 in CE
          var date = new Date(year, month - 1);

          if (!min || date < min) {
            min = date;
          }
          if (!max || date > max) {
            max = date;
          }

          if (!buckets[date]) {
            buckets[date] = {};
            buckets[date][types[documentTypes.journal]]   = [];
            buckets[date][types[documentTypes.external]]  = [];
            buckets[date][types[documentTypes.patent]]    = [];
            buckets[date][types[documentTypes.internal]]  = [];
            buckets[date][types[documentTypes.technical]] = [];
            buckets[date][types[documentTypes.other]]     = [];
          }

          buckets[date][paperType].push({
            id:         paperId,
            title:      paperName,
            citations:  paperCitationCount
          });
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
            url:        thisPaper.url,
            value:      thisPaper.citations,
            type:       utils.sortTypes(thisPaper.types),
            venue:      thisPaper.venue,
            authors:    thisPaper.authors,
            weight:     thisPaper.weight,
            class:      []
          };

          for (j = 0; j < paperItem.type.length; ++j) {
            paperItem.class.push(utils.getClassName(paperItem.type[j]));
          }

          $scope.papers.push(paperItem);
        }
      }

      // calculate stats
      $scope.journalPapers    = $scope.typeCount[types[documentTypes.journal]];
      $scope.externalPapers   = $scope.typeCount[types[documentTypes.external]];
      $scope.patents          = $scope.typeCount[types[documentTypes.patent]];
      $scope.internalPapers   = $scope.typeCount[types[documentTypes.internal]];
      $scope.technicalReports = $scope.typeCount[types[documentTypes.technical]];
      $scope.otherDocuments   = $scope.typeCount[types[documentTypes.other]];
      $scope.totalExternalPublications = $scope.journalPapers + $scope.externalPapers + $scope.patents;
      $scope.totalInternalPublications = $scope.internalPapers + $scope.technicalReports + $scope.otherDocuments;

      // build chart data
      if (min && max) {
        // add empty buckets
        var thisDate = min;
        while (thisDate.getTime() !== max.getTime()) {
          if (!buckets[thisDate]) {
            buckets[thisDate] = {};
            buckets[thisDate][types[documentTypes.journal]] = [];
            buckets[thisDate][types[documentTypes.external]] = [];
            buckets[thisDate][types[documentTypes.patent]] = [];
            buckets[thisDate][types[documentTypes.internal]] = [];
            buckets[thisDate][types[documentTypes.technical]] = [];
            buckets[thisDate][types[documentTypes.other]] = [];
          }

          var thisMonth = thisDate.getMonth();
          if (parseInt(thisMonth, 10) < 11) {
            thisDate.setMonth(thisMonth + 1);
          } else {
            var thisYear = thisDate.getFullYear();
            thisDate.setMonth(0);
            thisDate.setFullYear(parseInt(thisYear, 10) + 1);
          }
        }

        $scope.chartData = [];
        for (var d in buckets) {
          if (buckets.hasOwnProperty(d)) {
            $scope.chartData.push({
              date: d,
              journal:    buckets[d][types[documentTypes.journal]],
              external:   buckets[d][types[documentTypes.external]],
              patent:     buckets[d][types[documentTypes.patent]],
              internal:   buckets[d][types[documentTypes.internal]],
              technical:  buckets[d][types[documentTypes.technical]],
              other:      buckets[d][types[documentTypes.other]]
            });
          }
        }
      }

      $scope.pieData = [{
        label: types[documentTypes.journal],
        value: $scope.journalPapers
      }, {
        label: types[documentTypes.external],
        value: $scope.externalPapers
      }, {
        label: types[documentTypes.patent],
        value: $scope.patents
      }, {
        label: types[documentTypes.internal],
        value: $scope.internalPapers
      }, {
        label: types[documentTypes.technical],
        value: $scope.technicalReports
      }, {
        label: types[documentTypes.other],
        value: $scope.otherDocuments
      }];
    });
}]);
