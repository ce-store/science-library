'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:OrganisationCtrl
 * @description
 * # OrganisationCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('OrganisationCtrl', ['$scope', '$stateParams', '$document', 'store', 'hudson', 'documentTypes', 'utils', 'csv', 'colours', 'urls', 'definitions', function ($scope, $stateParams, $document, store, hudson, documentTypes, utils, csv, colours, urls, ce) {
    $scope.views = ["chart", "list", "authors"];
    $scope.scienceLibrary = urls.scienceLibrary;
    $scope.journalType            = documentTypes.journal;
    $scope.patentType             = documentTypes.patent;
    $scope.externalConferenceType = documentTypes.external;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType    = documentTypes.technical;
    $scope.otherDocumentType      = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = true;

    $scope.sortTypes = {
      papers: {
        names:    ['most collaborative', 'citation count', 'most recent', 'name'],
        values:   ['weight', 'value', 'date', 'name'],
        show:     [false, true, false, false],
        reverse:  ['-', '-', '-', '+']
      },
      authors: {
        names:    ['external paper count', 'ITA citation count', 'ITA h-index', 'co-author count', 'name'],
        values:   ['externalCount', 'citationCount', 'hIndex', 'coAuthorCount', 'name'],
        show:     [true, true, true, true, false],
        reverse:  ['-', '-', '-', '-', '+']
      }
    };

    var lastHighlight = null;
    var types = documentTypes.nameMap;

    $scope.$on('question:added', function() {
      refreshHighlight();
    });

    $scope.showView = function (view) {
      $scope.currentView = view;

      if (view === $scope.views[1]) {
        $scope.sort   = $scope.sortTypes.papers;
        $scope.header = $scope.papersHeader;
      } else if (view === $scope.views[2]) {
        $scope.sort   = $scope.sortTypes.authors;
        $scope.header = $scope.authorsHeader;
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
        $scope.papers     = {};
        $scope.variants   = {};
        $scope.employees  = {};
        var min, max;

        var properties = data.main_instance.property_values;
        var relatedInstances = data.related_instances;

        // organisation properties
        var name = utils.getUnknownProperty(properties, ce.organisation.name);
        var shortName = data.main_instance._id;
        var type = utils.getIndustryFor(data.main_instance);
        var affiliation = utils.getProperty(properties, ce.organisation.affiliation);
        var documentList = utils.getListProperty(properties, ce.organisation.documentList);
        var employeeList = utils.getListProperty(properties, ce.organisation.employeeList);
        var externalDocumentCount = utils.getIntProperty(properties, ce.organisation.externalDocumentCount);
        var internalDocumentCount = utils.getIntProperty(properties, ce.organisation.internalDocumentCount);
        var journalCount = utils.getIntProperty(properties, ce.organisation.journalCount);
        var patentCount = utils.getIntProperty(properties, ce.organisation.patentCount);
        var externalConferencePaperCount = utils.getIntProperty(properties, ce.organisation.externalConferencePaperCount);
        var internalConferencePaperCount = utils.getIntProperty(properties, ce.organisation.internalConferencePaperCount);
        var technicalReportCount = utils.getIntProperty(properties, ce.organisation.technicalReportCount);
        var otherCount = utils.getIntProperty(properties, ce.organisation.otherCount);

        $scope.name     = name;
        $scope.industry = type;
        $scope.country  = affiliation;
        $scope.authorsHeader  = shortName + "'s authors";
        $scope.papersHeader   = shortName + "'s papers";

        $scope.journalPapers    = journalCount;
        $scope.patents          = patentCount;
        $scope.externalPapers   = externalConferencePaperCount;
        $scope.internalPapers   = internalConferencePaperCount;
        $scope.technicalReports = technicalReportCount;
        $scope.otherDocuments   = otherCount;

        $scope.totalExternalPublications = externalDocumentCount;
        $scope.totalInternalPublications = internalDocumentCount;

        $scope.papersList   = [];
        $scope.authorsList  = [];
        var documentMap = {};
//        var csvData     = [];

        // loop through employees
        for (var i = 0; i < employeeList.length; ++i) {
          var authorId = employeeList[i];
          var author = relatedInstances[authorId];
          var authorProps = author.property_values;

          // author properties
          var authorName = utils.getProperty(authorProps, ce.author.fullName);
          var authorDocumentCount = utils.getIntProperty(authorProps, ce.author.documentCount);
          var authorExternalDocumentCount = utils.getIntProperty(authorProps, ce.author.externalDocumentCount);
          var authorLocalCitationCount = utils.getIntProperty(authorProps, ce.author.localCitationCount);
          var authorLocalHIndex = utils.getIntProperty(authorProps, ce.author.localHIndex);
          var authorCoAuthorCount = utils.getIntProperty(authorProps, ce.author.coAuthorCount);

          // add author to employee list
          $scope.employees[authorId] = {
            id:     authorId,
            name:   authorName,
            value:  authorDocumentCount
          };
          $scope.authorsList.push({
            id:             authorId,
            name:           authorName,
            documentCount:  authorDocumentCount,
            externalCount:  authorExternalDocumentCount,
            citationCount:  authorLocalCitationCount,
            hIndex:         authorLocalHIndex,
            coAuthorCount:  authorCoAuthorCount
          });
        }

        // loop through papers
        if (documentList) {
          var j, k;
          for (j = 0; j < documentList.length; ++j) {
            var paperId = documentList[j];
            var paper   = relatedInstances[paperId];
            var paperProps = paper.property_values;

            // paper properties
            var paperTitle  = utils.getUnknownProperty(paperProps, ce.paper.title);
            var paperType   = utils.getType(paper.direct_concept_names || paper.concept_names);
            var paperVenue  = utils.getProperty(paperProps, ce.paper.venue);
            var paperWeight = utils.getIntProperty(paperProps, ce.paper.weight);
            var paperVariantList = utils.getListProperty(paperProps, ce.paper.variantList);
            var paperCitationCount = utils.getIntProperty(paperProps, ce.paper.citationCount);
            var paperNoteworthy = utils.getProperty(paperProps, ce.paper.noteworthyReason);
            var paperFinalDate = utils.getDateProperty(paperProps, ce.paper.finalDate);
            var paperFinalDateString = utils.getProperty(paperProps, ce.paper.finalDate);
            var paperFullAuthorString = utils.getUnknownProperty(paperProps, ce.paper.fullAuthorString);

            // check variant hasn't already been added
            if (!documentMap[paperId]) {
              var variantFound = false;
              var maxCitations = 0;

              // find max variant
              if (paperVariantList) {
                for (k = 0; k < paperVariantList.length; ++k) {
                  var variantId = paperVariantList[k];

                  if (documentMap[variantId]) {
                    maxCitations = documentMap[variantId].citations > maxCitations ? documentMap[variantId].citations : maxCitations;
                    variantFound = variantId;
                  }
                }
              }

              // set citation count in map
              if (!variantFound) {
                documentMap[paperId] = {
                  index:      j,
                  title:      paperTitle,
                  citations:  paperCitationCount,
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
                    index:      j,
                    title:      paperTitle,
                    citations:  paperCitationCount,
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

              // get date properties
              var dateId = null;
              var month = null;
              var year = null;

              if (paperFinalDateString) {
                month = relatedInstances[paperFinalDateString].property_values.month;
                year = relatedInstances[paperFinalDateString].property_values.year;
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

          // recreate array - test for index to remove duplicate citations
          for (j = 0; j < documentList.length; ++j) {
            var thisPaperId = documentList[j];
            var thisPaper = documentMap[thisPaperId];

            if (thisPaper && thisPaper.index === j) {
              var paperItem = {
                id:         thisPaperId,
                name:       thisPaper.title,
                noteworthy: thisPaper.noteworthy,
                date:       thisPaper.date,
                value:      thisPaper.citations,
                type:       utils.sortTypes(thisPaper.types),
                venue:      thisPaper.venue,
                authors:    thisPaper.authors,
                weight:     thisPaper.weight,
                class:      []
              };

//              for (k = 0; k < paperItem.type.length; ++k) {
//                paperItem.class.push(utils.getClassName(paperItem.type[k]));
//                csvData.push([paperItem.id, paperItem.name, paperItem.value, paperItem.type[k], paperItem.venue, paperItem.authors]);
//              }

              $scope.papers[thisPaperId] = (paperItem);
              $scope.papersList.push(paperItem);
            }
          }
        }

//        csv.setData(csvData);
//        csv.setHeader(["paper id", "paper name", "citation count", "paper type", "venue", "authors"]);
//        csv.setName($stateParams.organisationId);

        // build chart data
        if (min && max) {
          // add empty buckets
          var thisDate = min;
          while (thisDate.getTime() !== max.getTime()) {
            if (!buckets[thisDate]) {
              buckets[thisDate] = {};
              buckets[thisDate][types[$scope.journalType]]            = [];
              buckets[thisDate][types[$scope.patentType]]             = [];
              buckets[thisDate][types[$scope.externalConferenceType]] = [];
              buckets[thisDate][types[$scope.internalConferenceType]] = [];
              buckets[thisDate][types[$scope.technicalReportType]]    = [];
              buckets[thisDate][types[$scope.otherDocumentType]]      = [];
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
                date:       d,
                journal:    buckets[d][types[$scope.journalType]],
                external:   buckets[d][types[$scope.externalConferenceType]],
                patent:     buckets[d][types[$scope.patentType]],
                internal:   buckets[d][types[$scope.internalConferenceType]],
                technical:  buckets[d][types[$scope.technicalReportType]],
                other:      buckets[d][types[$scope.otherDocumentType]]
              });
            }
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

        $scope.showView($scope.views[0]);
      });
  }]);
