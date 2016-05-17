'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:AuthorCtrl
 * @description
 * # AuthorCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('AuthorCtrl', ['$scope', '$stateParams', '$timeout', 'store', 'server', 'hudson', 'documentTypes', 'utils', 'csv', 'colours', function ($scope, $stateParams, $timeout, store, server, hudson, documentTypes, utils, csv, colours) {
    $scope.views = ['graph', 'papers', 'co-authors', 'co-authors-graph'];
    $scope.journalType = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.patentType = documentTypes.patent;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType = documentTypes.technical;
    $scope.otherDocumentType = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = $scope.acInput = $scope.indInput = $scope.govInput = true;

    $scope.sortTypes = {
      papers: {
        names: ['most collaborative', 'citation count', 'most recent', 'name'],
        values: ['weight', 'citations', 'date', 'name'],
        show: [false, true, false, false],
        reverse: ['-', '-', '-', '+']
      },
      coAuthors: {
        names: ['shared paper count', 'name'],
        values: ['count', 'name'],
        show: [true, false],
        reverse: ['-', '+']
      }
    };

    var lastHighlight = null;
    var types = documentTypes.nameMap;

    $scope.$on('question:added', function() {
      refreshHighlight();
    });

    var generateCSVData = function() {
      // csv
      var csvData = [];
      if ($scope.currentView === $scope.views[0] || $scope.currentView === $scope.views[1]) {
        for (var paper in $scope.papersList) {
          var p = $scope.papersList[paper];
          for (var i in p.type) {
            csvData.push([p.id, p.name, p.citations, p.type[i], p.venue, p.authors]);
          }
        }

        csv.setData(csvData);
        csv.setHeader(["paper id", "paper name", "citation count", "paper type", "venue", "authors"]);
        csv.setName($stateParams.authorId + "_papers");
      } else {
        for (var coAuthor in $scope.coauthorsList) {
          var ca = $scope.coauthorsList[coAuthor];
          csvData.push([ca.id, ca.name, ca.count]);
        }

        csv.setData(csvData);
        csv.setHeader(["author id", "author name", "co-authored papers count"]);
        csv.setName($stateParams.authorId + "_coauthors");
      }
    };

    $scope.showView = function (view) {
      $scope.currentView = view;

      if (view === $scope.views[0]) {
        angular.element("svg.chart").remove();
        // Wait for doms to be created
        $timeout(function() {
          drawNarrativeChart($stateParams.authorId, true, false, false, $scope.data);
        }, 100);
      }

      if (view === $scope.views[1]) {
        $scope.sort = $scope.sortTypes.papers;
        $scope.header = $scope.papersHeader;
      } else if (view === $scope.views[2]) {
        $scope.sort = $scope.sortTypes.coAuthors;
        $scope.header = $scope.coAuthorsHeader;
      }

      generateCSVData();
    };

    var refreshHighlight = function() {
      var qa = hudson.getLatestQuestion();

      if (lastHighlight) {
        $scope[lastHighlight] = false;
      }

      if (qa && qa.type === 'highlight') {
        $scope[qa.property + 'Highlight'] = true;
        lastHighlight = qa.property + 'Highlight';

        if (qa.property === 'wrote') {
          $scope.showView($scope.views[1]);
        } else if (qa.property === 'co-author') {
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

    store.getAuthor($stateParams.authorId)
      .then(function(data) {
        $scope.data = data;
        var unknown = "Unknown";

        var properties = data.structured_response.main_instance.property_values;
        var relatedInstances = data.structured_response.related_instances;

        // Set data
        $scope.authorId = $stateParams.authorId;
        $scope.author = properties["full name"] ? properties["full name"][0] : unknown;
        $scope.coAuthorsHeader = $scope.author + "'s co-authors";
        $scope.papersHeader = $scope.author + "'s papers";

        // Employer
        $scope.employer = {};
        if (properties["is employed by"]) {
          var relatedEmployer = relatedInstances[properties["is employed by"][0]];

          if (relatedEmployer) {
            if (relatedEmployer.property_values.name) {
              $scope.employer = {
                id: relatedEmployer._id,
                name: relatedEmployer.property_values.name[0]
              };
            } else {
              $scope.employer = {
                id: relatedEmployer._id,
                name: relatedEmployer._id
              };
            }

            if (relatedEmployer.property_values.type) {
              $scope.type = relatedEmployer.property_values.type[0];
            }
          }
        }

        // Publications
        $scope.journalPapers = properties["journal paper count"] ? parseInt(properties["journal paper count"][0], 10) : 0;
        $scope.externalPapers = properties["external conference paper count"] ? parseInt(properties["external conference paper count"][0], 10) : 0;
        $scope.patents = properties["patent count"] ? parseInt(properties["patent count"][0], 10) : 0;
        $scope.internalPapers = properties["internal conference paper count"] ? parseInt(properties["internal conference paper count"][0], 10) : 0;
        $scope.technicalReports = properties["technical report count"] ? parseInt(properties["technical report count"][0], 10) : 0;
        $scope.otherDocuments = properties["other document count"] ? parseInt(properties["other document count"][0], 10) : 0;
        $scope.totalExternalPublications = properties["external document count"] ? parseInt(properties["external document count"][0], 10) : 0;
        $scope.totalInternalPublications = properties["internal document count"] ? parseInt(properties["internal document count"][0], 10) : 0;

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
        $scope.scholarLink = "https://scholar.google.co.uk/scholar?q=" + properties["full name"][0] + "&btnG=&hl=en&as_sdt=0%2C5";

        if (properties["citation count"]) {
          var citationCount = relatedInstances[properties["citation count"][0]].property_values;

          // local and google citation count && h-index
          var url = citationCount.url ? citationCount.url[0] : null;

         var googleCount = citationCount["citation count"] ? citationCount["citation count"][0] : 0;
         var googleHIndex = citationCount["h-index"] ? citationCount["h-index"][0] : 0;
          var count = properties["local citation count"] ? properties["local citation count"][0] : 0;
          var hIndex = properties["local h-index"] ? properties["local h-index"][0] : 0;

          $scope.citationCount = {
            url: url,
            count: parseInt(count, 10)
          };
          $scope.hIndex = {
            url: url,
            index: parseInt(hIndex, 10)
          };
          $scope.googleCitationCount = {
            url: url,
            count: parseInt(googleCount, 10)
          };
          $scope.googleHIndex = {
            url: url,
            index: parseInt(googleHIndex, 10)
          };
        }

        var i, j;
        // papers
        $scope.papersList = [];
        var documentMap = {};
        if (properties.wrote) {
          for (i = 0; i < properties.wrote.length; ++i) {
            var paperId = properties.wrote[i];
            var paper = relatedInstances[paperId];
            var paperType = utils.getType(paper.direct_concept_names);
            var paperProps = paper.property_values;
            var citationId = paperProps["citation count"];
            var paperCitationCount = 0;

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

              if (citationId) {
                var citationProps = relatedInstances[citationId].property_values;

                // set citation count in map
                paperCitationCount = citationProps["citation count"] ? parseInt(citationProps["citation count"][0], 10) : 0;
                if (!variantFound) {
                  documentMap[paperId] = {
                    citations: paperCitationCount,
                    index: i,
                    title: paperProps.title ? paperProps.title[0] : unknown,
                    noteworthy: paperProps["noteworthy reason"] ? paperProps["noteworthy reason"][0] : null,
                    date: paperProps["final date"] ? Date.parse(paperProps["final date"][0]) : 0,
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
                      index: i,
                      title: paperProps.title ? paperProps.title[0] : unknown,
                      noteworthy: paperProps["noteworthy reason"] ? paperProps["noteworthy reason"][0] : null,
                      date: paperProps["final date"] ? Date.parse(paperProps["final date"][0]) : 0,
                      types: [paperType].concat(variantTypes),
                      venue: paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"][0] : ""),
                      authors: paperProps["original authors string"] ? paperProps["original authors string"][0] : "",
                      weight: paperProps.weight ? paperProps.weight[0] : -1
                    };
                  } else {
                    documentMap[variantFound].types.push(paperType);
                  }
                }
              }
            }
          }

          // recreate array - test for index to remove duplicate citations
          for (i = 0; i < properties.wrote.length; ++i) {
            var thisPaperId = properties.wrote[i];
            var thisPaper = documentMap[thisPaperId];

            if (thisPaper && thisPaper.index === i) {
              var paperItem = {
                id: thisPaperId,
                name: thisPaper.title,
                noteworthy: thisPaper.noteworthy,
                date: thisPaper.date,
                citations: thisPaper.citations,
                type: utils.sortTypes(thisPaper.types),
                venue: thisPaper.venue,
                authors: thisPaper.authors,
                class: [],
                weight: thisPaper.weight
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
          id: $scope.authorId,
          name: $scope.author,
          group: $scope.type,
          count: $scope.totalPublications
        });

        if (properties['co-author statistic'] !== null) {
          for (i = 0; i < properties['co-author statistic'].length; ++i) {
            var statId = properties['co-author statistic'][i];
            var coAuthorStatProps = relatedInstances[statId].property_values;

            var coAuthorIds = coAuthorStatProps["co-author"];
            var coAuthorId = coAuthorIds[0] === $scope.authorId ? coAuthorIds[1] : coAuthorIds[0];
            var coAuthorCount = coAuthorStatProps["co-author count"] ? parseInt(coAuthorStatProps["co-author count"][0], 10) : 1;
            var coAuthorProps = relatedInstances[coAuthorId].property_values;
            var coAuthorName = coAuthorProps["full name"] ? coAuthorProps["full name"][0] : unknown;
            var coAuthorEmployer = coAuthorProps["is employed by"] ? coAuthorProps["is employed by"][0] : unknown;
            var coAuthorType;
            if (coAuthorEmployer !== unknown) {
              if (relatedInstances[coAuthorEmployer].property_values.type) {
                coAuthorType = relatedInstances[coAuthorEmployer].property_values.type[0];
              }
            } else {
              coAuthorType = unknown;
            }

            $scope.coauthorsList.push({
              id: coAuthorId,
              name: coAuthorName,
              count: coAuthorCount
            });

            var coAuthorCoAuthors = coAuthorProps["co-author statistic"];
            var coCoAuthorStats = [];

            // remove root author's stats
            for (j in coAuthorCoAuthors) {
              var coCoAuthorStatProps = relatedInstances[coAuthorCoAuthors[j]].property_values;
              var found = false;

              for (var k in coCoAuthorStatProps["co-author"]) {
                if (coCoAuthorStatProps["co-author"][k] === $scope.authorId) {
                  found = true;
                }
              }

              if (!found) {
                var caCount = 1;
                if (coCoAuthorStatProps["co-author count"]) {
                  caCount = coCoAuthorStatProps["co-author count"][0];
                }
                coCoAuthorStats.push({
                  id: coAuthorCoAuthors[j],
                  authors: coCoAuthorStatProps["co-author"],
                  count: caCount
                });
              }
            }

            $scope.nodes.push({
              id: coAuthorId,
              name: coAuthorName,
              group: coAuthorType,
              count: coAuthorCount,
              links: coCoAuthorStats
            });
          }
        }

        // Draw charts
        if ($scope.currentView === $scope.views[0]) {
          drawNarrativeChart($stateParams.authorId, true, false, false, data, server);
        }

        generateCSVData();
        refreshHighlight();
    });

    $scope.showView($scope.views[0]);
  }]);
