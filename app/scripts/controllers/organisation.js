'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:OrganisationCtrl
 * @description
 * # OrganisationCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('OrganisationCtrl', ['$scope', '$stateParams', '$document', 'store', 'hudson', 'documentTypes', 'utils', 'csv', 'colours', function ($scope, $stateParams, $document, store, hudson, documentTypes, utils, csv, colours) {
    $scope.views = ["chart", "list", "authors"];
    $scope.currentView = $scope.views[0];
    $scope.journalType = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.patentType = documentTypes.patent;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType = documentTypes.technical;
    $scope.otherDocumentType = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = true;

    var lastHighlight = null;
    var types = documentTypes.nameMap;

    $scope.$on('question:added', function() {
      refreshHighlight();
    });

    $scope.showView = function (view) {
      $scope.currentView = view;
    };

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
          ($scope.patentInput &&
            value.type.indexOf(types[$scope.patentType]) > -1) ||
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

    var height = $scope.height - 270;

    // set max-height of papers list
    var elem = angular.element("#org-papers-list");
    elem.css("height", (height + 20) + "px");

    elem = angular.element("#org-papers-list .results-list");
    elem.css("max-height", "calc(100% - 75px)");

    // set max-height of authors list
    elem = angular.element("#org-authors-list");
    elem.css("height", height + "px");

    elem = angular.element("#org-authors-list .results-list");
    elem.css("max-height", "calc(100% - 55px)");

    store.getOrganisation($stateParams.organisationId)
      .then(function(data) {
        var buckets = {};
        $scope.papers = {};
        $scope.variants = {};
        $scope.employees = {};
        var min, max;

        var properties = data.main_instance.property_values;
        var relatedInstances = data.related_instances;

        $scope.name = properties.name ? properties.name[0] : null;
        $scope.industry = properties.type ? properties.type[0] : null;
        $scope.country = properties["is located at"] ? properties["is located at"][0] : null;

        $scope.journalPapers = properties["journal paper count"] ? parseInt(properties["journal paper count"][0], 10) : 0;
        $scope.externalPapers = properties["external paper count"] ? parseInt(properties["external paper count"][0], 10) : 0;
        $scope.patents = properties["patent count"] ? parseInt(properties["patent count"][0], 10) : 0;
        $scope.internalPapers = properties["internal paper count"] ? parseInt(properties["internal paper count"][0], 10) : 0;
        $scope.technicalReports = properties["technical report count"] ? parseInt(properties["technical report count"][0], 10) : 0;
        $scope.otherDocuments = properties["other document count"] ? parseInt(properties["other document count"][0], 10) : 0;

//DSB - changed to use CE computed value
//        $scope.totalPublications = $scope.journalPapers + $scope.externalPapers + $scope.patents + $scope.internalPapers;
        $scope.totalPublications = properties["paper count"] ? parseInt(properties["paper count"][0], 10) : 0;

        var employees = properties.employs;
        var documentMap = {};
        var csvData = [];

        // loop through employees
        for (var i = 0; i < employees.length; ++i) {
          var authorId = employees[i];
          var author = relatedInstances[authorId];
          var authorProps = author.property_values;

          var authorName = authorProps["full name"] ? authorProps["full name"][0] : null;

          // count papers
          var thisJournalPapers = authorProps["journal paper count"] ? parseInt(authorProps["journal paper count"][0], 10) : 0;
          var thisExternalPapers = authorProps["external paper count"] ? parseInt(authorProps["external paper count"][0], 10) : 0;
          var thisPatentPapers = authorProps["patent count"] ? parseInt(authorProps["patent count"][0], 10) : 0;
          var thisInternalPapers = authorProps["internal paper count"] ? parseInt(authorProps["internal paper count"][0], 10) : 0;
//DSB - changed to use CE computed value
//          var totalCount = thisJournalPapers + thisExternalPapers + thisPatentPapers + thisInternalPapers;
          var totalCount = authorProps["total publication count"] ? parseInt(authorProps["total publication count"][0], 10) : 0;

          // add author to employee list
          $scope.employees[authorId] = {
            id: authorId,
            name: authorName,
            value: totalCount
          };

          var papers = authorProps.wrote;

          // loop through papers
          if (papers) {
            var j, k;
            for (j = 0; j < papers.length; ++j) {
              var paperId = papers[j];
              var paper = relatedInstances[paperId];
              var paperProps = paper.property_values;

              var paperTitle = paperProps.title ? paperProps.title[0] : null;
              var paperType = utils.getType(paper.direct_concept_names);
              var paperCitationCount = 0;

              // check variant hasn't already been added
              if (!documentMap[paperId]) {
                var variantFound = false;
                var maxCitations = 0;

                // find max variant
                if (paperProps.variant) {
                  for (k = 0; k < paperProps.variant.length; ++k) {
                    var variantId = paperProps.variant[k];

                    if (documentMap[variantId]) {
                      maxCitations = documentMap[variantId].citations > maxCitations ? documentMap[variantId].citations : maxCitations;
                      variantFound = variantId;
                    }
                  }
                }

                var citationId = paperProps["citation count"] ? paperProps["citation count"][0] : null;

                if (citationId) {
                  var citation = relatedInstances[citationId];
                  var citationProps = citation.property_values;

                  // set citation count in map
                  paperCitationCount = citationProps["citation count"] ? parseInt(citationProps["citation count"][0], 10) : 0;
                  if (!variantFound) {
                    documentMap[paperId] = {
                      citations: paperCitationCount,
                      index: j,
                      title: paperTitle,
                      noteworthy: paperProps["noteworthy reason"] ? paperProps["noteworthy reason"][0] : null,
                      types: [paperType],
                      venue: paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"][0] : ""),
                      authors: paperProps["original authors string"] ? paperProps["original authors string"][0] : "",
                      weight: paperProps.weight ? paperProps.weight[0] : -1
                    };
                  } else {
                    if (maxCitations < paperCitationCount) {
                      var variantTypes = documentMap[variantFound].types.slice();
                      documentMap[variantFound] = null;
                      documentMap[paperId] = {
                        citations: paperCitationCount,
                        index: j,
                        title: paperTitle,
                        noteworthy: paperProps["noteworthy reason"] ? paperProps["noteworthy reason"][0] : null,
                        types: [paperType].concat(variantTypes),
                        venue: paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"][0] : ""),
                        authors: paperProps["original authors string"] ? paperProps["original authors string"][0] : "",
                        weight: paperProps.weight ? paperProps.weight[0] : -1
                      };
                    } else {
                      documentMap[variantFound].types.push(paperType);
                    }
                  }

                  // get date properties
                  var dateId = null;
                  var month = null;
                  var year = null;

                  if (paperProps["final date"]) {
                    dateId = paperProps["final date"][0];
                    month = relatedInstances[dateId].property_values.month;
                    year = relatedInstances[dateId].property_values.year;
                  }

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
                    buckets[date][types[$scope.journalType]] = [];
                    buckets[date][types[$scope.externalConferenceType]] = [];
                    buckets[date][types[$scope.patentType]] = [];
                    buckets[date][types[$scope.internalConferenceType]] = [];
                    buckets[date][types[$scope.technicalReportType]] = [];
                    buckets[date][types[$scope.otherDocumentType]] = [];
                  }

                  // buckets[date][paperType]++;
                  buckets[date][paperType].push({
                    id: paperId,
                    title: paperTitle,
                    citations: paperCitationCount
                  });
                }
              }
            }

            // recreate array - test for index to remove duplicate citations
            for (j = 0; j < papers.length; ++j) {
              var thisPaperId = papers[j];
              var thisPaper = documentMap[thisPaperId];

              if (thisPaper && thisPaper.index === j) {
                var paperItem = {
                  id: thisPaperId,
                  name: thisPaper.title,
                  noteworthy: thisPaper.noteworthy,
                  value: thisPaper.citations,
                  type: utils.sortTypes(thisPaper.types),
                  venue: thisPaper.venue,
                  authors: thisPaper.authors,
                  class: [],
                  weight: thisPaper.weight
                };

                for (k = 0; k < paperItem.type.length; ++k) {
                  paperItem.class.push(utils.getClassName(paperItem.type[k]));
                  csvData.push([paperItem.id, paperItem.name, paperItem.value, paperItem.type[k], paperItem.venue, paperItem.authors]);
                }

                $scope.papers[thisPaperId] = (paperItem);
              }
            }
          }
        }

        csv.setData(csvData);
        csv.setHeader(["paper id", "paper name", "citation count", "paper type", "venue", "authors"]);
        csv.setName($stateParams.organisationId);

        // build chart data
        if (min && max) {
          // add empty buckets
          var thisDate = min;
          while (thisDate.getTime() !== max.getTime()) {
            if (!buckets[thisDate]) {
              buckets[thisDate] = {};
              buckets[thisDate][types[$scope.journalType]] = [];
              buckets[thisDate][types[$scope.externalConferenceType]] = [];
              buckets[thisDate][types[$scope.patentType]] = [];
              buckets[thisDate][types[$scope.internalConferenceType]] = [];
              buckets[thisDate][types[$scope.technicalReportType]] = [];
              buckets[thisDate][types[$scope.otherDocumentType]] = [];
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
          for (var date in buckets) {
            $scope.chartData.push({
              date: date,
              journal: buckets[date][types[$scope.journalType]],
              external: buckets[date][types[$scope.externalConferenceType]],
              patent: buckets[date][types[$scope.patentType]],
              internal: buckets[date][types[$scope.internalConferenceType]],
              technical: buckets[date][types[$scope.technicalReportType]],
              other: buckets[date][types[$scope.otherDocumentType]]
            });
          }

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

          refreshHighlight();
        }
      });
  }]);
