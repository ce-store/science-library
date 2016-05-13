'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('MainCtrl', ['$scope', '$stateParams', '$location', '$sce', 'store', 'charts', 'debug', 'documentTypes', 'utils', 'csv', 'colours', 'localStorageService', 'server', function ($scope, $stateParams, $location, $sce, store, charts, debug, documentTypes, utils, csv, colours, localStorageService, server) {
    $scope.listTypes = {
      papers: 'papers',
      authors: 'authors',
      venues: 'venues',
      projects: 'projects',
      orgs: 'organisations',
      coauthors: 'co-authors',
      topics: 'topics'
    };
    $scope.listLength = 50;
    // TODO: Complete these!
    $scope.sortTypes = {
      'papers': {
        names: ['most collaborative', 'citation count', 'most recent', 'name'],
        values: ['weight', 'value', 'date', 'name'],
        show: [false, true, false, false],
        reverse: ['-', '-', '-', '+']
      },
      'authors': {
        names: null,//['external papers', 'ITA citations', 'ITA h-index', 'co-author'],
        values: null
      },
      'venues': { names: null, values: null },
      'projects': { names: null, values: null },
      'organisations': {
        names: ['authors', 'papers'],
        values: ['value', 'papers'],
        show: [true, true],
        reverse: ['-', '-']
      },
      'co-authors': { names: null, values: null },
      'topics': { names: null, values: null }
    };

    $scope.journalType = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.patentType = documentTypes.patent;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType = documentTypes.technical;
    $scope.otherDocumentType = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = $scope.acInput = $scope.indInput = $scope.govInput = true;

    $scope.scatterYAxisOpts = ["hIndex", "citations"];
    $scope.scatterYAxis = $scope.scatterYAxisOpts[0];

    var scatterColour = d3.scale.ordinal()
        .domain(["AC", "IND", "GOV"])
        .range(colours.areas);

    var legendMap = {
      'AC': 'Academic',
      'IND': 'Industry',
      'GOV': 'Government',
      'Unknown': 'Unknown'
    };

    var unknown = "unknown";
    var types = documentTypes.nameMap;

    if ($stateParams.debug) {
      debug.set($stateParams.debug);
    }

    var resetTypeCount = function() {
      $scope.typeCount = {};
      $scope.typeCount[types[$scope.journalType]] = 0;
      $scope.typeCount[types[$scope.externalConferenceType]] = 0;
      $scope.typeCount[types[$scope.patentType]] = 0;
      $scope.typeCount[types[$scope.internalConferenceType]] = 0;
      $scope.typeCount[types[$scope.technicalReportType]] = 0;
      $scope.typeCount[types[$scope.otherDocumentType]] = 0;
    };

    resetTypeCount();

    $scope.select = function(type) {
      $scope.listName = type;
      $scope.list = [];
      $scope.sort = $scope.sortTypes[type];
      getData();
    };

    $scope.reset = function () {
      localStorageService.clearAll();
      localStorage.clear();
    };

    // get window size
    $scope.width = window.innerWidth;
    $scope.height = window.innerHeight;

    // set max-height of results lists
    var resultsListElems = angular.element(".results-list");
    var maxHeight = $scope.height - 305;
    resultsListElems.css("max-height", maxHeight + "px");

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

    $scope.filterOrganisations = function(value) {
      return ($scope.acInput && value.area === "AC") ||
      ($scope.indInput && value.area === "IND") ||
      ($scope.govInput && value.area === "GOV");
    };

    var populateList = function(data, instances) {
      $scope.list = [];
      $scope.areaNames = [];
      $scope.projects = {};
      var csvData = [];
      var csvHeader;
      var csvName;

      resetTypeCount();

      // loop through results and extract relevant data
      for (var i = 0; i < data.length; ++i) {
        var id, citations, name, date, hIndex, totalPubs, type, className, value, papers, weight, noteworthy;
        var citationProps;
        var area, areaId;

        id = data[i][0];

        if ($scope.listName === $scope.listTypes.papers) {
          // papers page
          var paperProps = instances[data[i][0]].property_values;
          citationProps = instances[data[i][1]].property_values;

          name = paperProps.title ? paperProps.title[0] : unknown;
          date = paperProps["final date"] ? Date.parse(paperProps["final date"][0]) : 0;
          citations = citationProps["citation count"] ? parseInt(citationProps["citation count"][0], 10) : 0;
          weight = paperProps.weight ? parseInt(paperProps.weight[0], 10) : -1;

          // set types for duplicates and non-duplicates
          var types = data[i][3];
          var j;
          if (types.length > 1) {
            type = utils.sortTypes(types);
            for (j in types) {
              $scope.typeCount[types[j]]++;
            }
          } else {
            type = [types[0]];
            $scope.typeCount[type]++;
          }

          // noteworthy
          noteworthy = paperProps["noteworthy reason"] ? paperProps["noteworthy reason"][0] : null;

          // generate class names
          className = [];
          for (j = 0; j < type.length; ++j) {
            className.push(utils.getClassName(type[j]));

            var venue = paperProps.venue ? paperProps.venue[0] : (paperProps["old venue"] ? paperProps["old venue"][0] : "");
            var authors = paperProps["original authors string"] ? paperProps["original authors string"][0] : "";
            csvData.push([id, name, citations, type[j], venue, authors]);
          }
        } else if ($scope.listName === $scope.listTypes.authors) {
          // authors page
          var personProps = instances[data[i][0]].property_values;
          citationProps = instances[data[i][1]].property_values;

          name = data[i][3];
          citations = personProps["local citation count"] ? parseInt(personProps["local citation count"][0], 10) : 0;
          hIndex = personProps["local h-index"] ? parseInt(personProps["local h-index"][0], 10) : 0;

          var journals = personProps["journal paper count"] ? parseInt(personProps["journal paper count"][0], 10) : 0;
          var conferences = personProps["conference paper count"] ? parseInt(personProps["conference paper count"][0], 10) : 0;
          totalPubs = journals + conferences;

          csvData.push([id, name, citations, hIndex]);
        } else if ($scope.listName === $scope.listTypes.venues) {
          // venues page
          name = data[i][1];

          csvData.push([id, name]);
        } else if ($scope.listName === $scope.listTypes.projects) {
          // projects page
          areaId = data[i][1];
          var projectProps = instances[id].property_values;
          name = projectProps.name ? projectProps.name[0] : null;
          value = projectProps.paper ? projectProps.paper.length : 0;
          area = instances[areaId].property_values.name ? instances[areaId].property_values.name[0] : null;

          csvData.push([areaId, area, id, name, value]);
        } else if ($scope.listName === $scope.listTypes.orgs) {
          // organisations page
          var orgProps = instances[id].property_values;
          name = orgProps.name ? orgProps.name[0] : null;
          value = orgProps.employs ? orgProps.employs.length : 0;
          papers = orgProps["paper count"] ? orgProps["paper count"][0] : 0;
          area = orgProps.type ? orgProps.type[0] : null;
          if (area) {
            className = utils.getClassName(area);
          }

          csvData.push([id, name, area, value, papers]);
        } else if ($scope.listName === $scope.listTypes.topics) {
          // topics page
          var topicProps = instances[id].property_values;
          papers = topicProps["paper count"] ? topicProps["paper count"][0] : 0;

          csvData.push([id, papers]);
        }

        // set value property
        if ($scope.listName === $scope.listTypes.papers) {
          value = citations;
        } else if ($scope.listName === $scope.listTypes.authors) {
          value = totalPubs;
        }

        if ($scope.listName === $scope.listTypes.projects) {
          if (!$scope.projects[area]) {
            $scope.projects[area] = [];
            $scope.areaNames.push(area);
          }

          $scope.projects[area].push({
            id: id,
            name: name,
            value: parseInt(value, 10),
            papers: parseInt(papers, 10),
            class: className
          });
        } else {
          // push results to list
          $scope.list.push({
            id: id,
            name: name,
            date: date,
            value: parseInt(value, 10),
            papers: parseInt(papers, 10),
            area: area,
            areaId: areaId,
            type: type,
            class: className,
            weight: weight,
            noteworthy: noteworthy
          });
        }
      }

      if ($scope.listName === $scope.listTypes.papers) {
        csvHeader = ["paper id", "name", "citation count", "paper type", "venue", "authors"];
        csvName = "papers";
      } else if ($scope.listName === $scope.listTypes.authors) {
        csvHeader = ["author id", "name", "citation count", "h-index count"];
        csvName = "authors";
      } else if ($scope.listName === $scope.listTypes.venues) {
        csvHeader = ["venue id", "name"];
        csvName = "venues";
      } else if ($scope.listName === $scope.listTypes.projects) {
        csvHeader = ["technical area id", "technical area name", "project id", "project name", "papers count"];
        csvName = "projects";
      } else if ($scope.listName === $scope.listTypes.orgs) {
        csvHeader = ["organisation id", "name", "type", "employee count", "papers count"];
        csvName = "organisations";
      }

      csv.setName(csvName);
      csv.setHeader(csvHeader);
      csv.setData(csvData);
    };

    var getData = function() {
      store.getLastUpdated()
        .then(function(response) {
          var foundComputeMessage = false;
          var lastUpdatedText = "";

          if (response.results.length > 0) {
            for (var i in response.results) {
              var msg = response.results[i];

              if (msg) {
                if (msg[0] == "msg date") {
                  lastUpdatedText = msg[1];
                }
                if (msg[0] == "msg computed") {
                  foundComputeMessage = true;
                }
              }
            }

            if (!foundComputeMessage) {
              lastUpdatedText += " (computed data not yet generated)";
            }
            $scope.lastUpdated = lastUpdatedText;
          }
        });

      if ($scope.listName === $scope.listTypes.papers) {
        store.getDocuments()
          .then(function(results) {
            populateList(results.data, results.instances);

            $scope.journalPapers = $scope.typeCount[types[$scope.journalType]];
            $scope.externalPapers = $scope.typeCount[types[$scope.externalConferenceType]];
            $scope.patents = $scope.typeCount[types[$scope.patentType]];
            $scope.internalPapers = $scope.typeCount[types[$scope.internalConferenceType]];
            $scope.technicalReports = $scope.typeCount[types[$scope.technicalReportType]];
            $scope.otherDocuments = $scope.typeCount[types[$scope.otherDocumentType]];

//DSB - changed to use only journal and external paper counts
//            $scope.totalPublications = $scope.journalPapers + $scope.externalPapers + $scope.internalPapers + $scope.technicalReports + $scope.otherDocuments;
            $scope.totalPublications = $scope.journalPapers + $scope.externalPapers + $scope.patents;

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
          });
      } else if ($scope.listName === $scope.listTypes.authors) {
        store.getPublishedPeople()
          .then(function(results) {
            populateList(results.data, results.instances);
            $scope.options = charts.getScatterData(results, server);
          });
      } else if ($scope.listName === $scope.listTypes.venues) {
        store.getEventSeries()
          .then(function(data) {
            populateList(data);
          });
      } else if ($scope.listName === $scope.listTypes.projects) {
        store.getProjects()
          .then(function(data) {
            populateList(data.results, data.instances);
          });
      } else if ($scope.listName === $scope.listTypes.orgs) {
        store.getOrganisations()
          .then(function(data) {
            populateList(data.results, data.instances);
            $scope.sunburstData = charts.getSunburstData(data);
          });
      } else if ($scope.listName === $scope.listTypes.topics) {
        store.getTopics()
          .then(function(data) {
            populateList(data.results, data.instances);
          });
      }
    };

    $scope.select($scope.listTypes.papers);
  }]);
