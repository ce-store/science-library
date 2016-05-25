'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('MainCtrl', ['$scope', '$stateParams', '$location', '$sce', 'store', 'charts', 'documentTypes', 'utils', 'csv', 'colours', 'localStorageService', 'server', 'definitions', function ($scope, $stateParams, $location, $sce, store, charts, documentTypes, utils, csv, colours, localStorageService, server, ce) {
    $scope.accepted = 'accepted';
    $scope.listTypes = {
      papers:   'papers',
      authors:  'authors',
      venues:   'venues',
      projects: 'projects',
      organisations: 'organisations',
      coauthors:  'co-authors',
      topics:     'topics'
    };
    $scope.sortTypes = {
      'papers': {
        names:    ['most collaborative', 'citation count', 'most recent', 'name'],
        values:   ['weight', 'citations', 'date', 'name'],
        show:     [false, true, false, false],
        reverse: ['-', '-', '-', '+']
      },
      'authors': {
        names:    ['external paper count', 'local citation count', 'local h-index', 'co-author count', 'name'],
        values:   ['externalCount', 'citations', 'hIndex', 'coAuthors', 'name'],
        show:     [true, true, true, true, false],
        reverse:  ['-', '-', '-', '-', '+']
      },
      'venues': {
        names:    ['name'], // ['papers', 'most recent', 'duration', 'citation count', 'name'],
        values:   ['name'],
        show:     [false],
        reverse:  ['+']
      },
      'projects': {},
      'organisations': {
        names:    ['authors', 'external paper count', 'citation count', 'name'],
        values:   ['value', 'externalCount', 'citations', 'name'],
        show:     [true, true, true, false],
        reverse:  ['-', '-', '-', '+']
      },
      'co-authors': {},
      'topics': {
        names:    ['collaborations', 'paper count'], //, 'author count', 'citation count', 'name'],
        values:   ['collaborations', 'papers'],
        show:     [true, true],
        reverse:  ['-', '-']
      }
    };

    $scope.journalType            = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.patentType             = documentTypes.patent;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType    = documentTypes.technical;
    $scope.otherDocumentType      = documentTypes.other;
    $scope.journalInput = $scope.externalInput = $scope.patentInput = $scope.internalInput = $scope.technicalInput = $scope.otherInput = $scope.acInput = $scope.indInput = $scope.govInput = true;

    $scope.scatterYAxisOpts = ["hIndex", "citations", "googleHIndex", "googleCitations"];
    $scope.scatterYAxis = $scope.scatterYAxisOpts[0];

    var scatterColour = d3.scale.ordinal()
        .domain(["AC", "IND", "GOV"])
        .range(colours.areas);

    var legendMap = {
      'AC':   'Academic',
      'IND':  'Industry',
      'GOV':  'Government',
      'Unknown': 'Unknown'
    };

    var types = documentTypes.nameMap;

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
    $scope.width  = window.innerWidth;
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
      $scope.list       = [];
      $scope.areaNames  = [];
      $scope.projects   = {};
      var csvData       = [];
      var csvHeader;
      var csvName;

      resetTypeCount();

      // loop through results and extract relevant data
      for (var i = 0; i < data.length; ++i) {
        var type, className;
        var citationProps;

        var id = data[i][0];

        if ($scope.listName === $scope.listTypes.papers) {
          // papers page
          var paperProps = instances[data[i][0]].property_values;
          citationProps = instances[data[i][1]].property_values;

          // paper properties
          var paperName = utils.getUnknownProperty(paperProps, ce.paper.title);
          var paperDate = utils.getDateProperty(paperProps, ce.paper.finalDate);
          var paperCitationCount = utils.getIntProperty(paperProps, ce.paper.citationCount);
          var paperWeight = utils.getIntProperty(paperProps, ce.paper.weight);
          var paperNoteworthy = utils.getProperty(paperProps, ce.paper.noteworthyReason);
          var paperStatus = utils.getProperty(paperProps, ce.paper.status);
          var paperVenue = utils.getProperty(paperProps, ce.paper.venue);
          var paperAuthorString = utils.getProperty(paperProps, ce.paper.fullAuthorString);

          // set types for duplicates and non-duplicates
          var types = data[i][3];
          var j;
          if (types.length > 1) {
            type = utils.sortTypes(types);
            for (j in types) {
              if (types.hasOwnProperty(j)) {
                $scope.typeCount[types[j]]++;
              }
            }
          } else {
            type = [types[0]];
            $scope.typeCount[type]++;
          }

          // generate class names
          className = [];
          for (j = 0; j < type.length; ++j) {
            className.push(utils.getClassName(type[j]));

            csvData.push([id, paperName, paperCitationCount, type[j], paperVenue, paperAuthorString]);
          }

          // push data to list
          $scope.list.push({
            id:         id,
            name:       paperName,
            date:       paperDate,
            citations:  paperCitationCount,
            weight:     paperWeight,
            type:       type,
            class:      className,
            noteworthy: paperNoteworthy,
            status:     paperStatus
          });
        } else if ($scope.listName === $scope.listTypes.authors) {
          // authors page
          var authorProps = instances[data[i][0]].property_values;
          citationProps = instances[data[i][1]].property_values;

          // author properties
          var authorName = data[i][3];
          var authorCitationCount = utils.getIntProperty(authorProps, ce.author.localCitationCount);
          var authorHIndex = utils.getIntProperty(authorProps, ce.author.localHIndex);
          var authorDocumentCount = utils.getIntProperty(authorProps, ce.author.documentCount);
          var authorExternalCount = utils.getIntProperty(authorProps, ce.author.externalDocumentCount);
          var authorCoAuthorCount = utils.getIntProperty(authorProps, ce.author.coAuthorCount);

          csvData.push([id, authorName, authorCitationCount, authorHIndex]);

          // push data to list
          $scope.list.push({
            id:         id,
            name:       authorName,
            citations:  authorCitationCount,
            hIndex:     authorHIndex,
            coAuthors:  authorCoAuthorCount,
            totalPubs:  authorDocumentCount,
            externalCount: authorExternalCount
          });
        } else if ($scope.listName === $scope.listTypes.venues) {
          // venues page
          var name = data[i][1];

          csvData.push([id, name]);

          // push data to list
          $scope.list.push({
            id:   id,
            name: name
          });
        } else if ($scope.listName === $scope.listTypes.projects) {
          // // projects page
          // areaId = data[i][1];
          // var projectProps = instances[id].property_values;

          // // project properties
          // name = projectProps.name ? projectProps.name[0] : null;
          // value = projectProps.paper ? projectProps.paper.length : 0;
          // area = instances[areaId].property_values.name ? instances[areaId].property_values.name[0] : null;

          // csvData.push([areaId, area, id, name, value]);

          // if (!$scope.projects[area]) {
          //   $scope.projects[area] = [];
          //   $scope.areaNames.push(area);
          // }

          // // push data to list
          // $scope.projects[area].push({
          //   id: id,
          //   name: name,
          //   value: parseInt(value, 10),
          //   papers: parseInt(papers, 10),
          //   areaId: areaId,
          //   class: className
          // });
        } else if ($scope.listName === $scope.listTypes.organisations) {
          // organisations page
          var orgProps = instances[id].property_values;

          // organisation properties
          var orgName = utils.getProperty(orgProps, ce.organisation.name);
          var orgEmployeeList = utils.getListProperty(orgProps, ce.organisation.employeeList);
          var orgDocumentCount = utils.getIntProperty(orgProps, ce.organisation.documentCount);
          var orgExternalCount = utils.getIntProperty(orgProps, ce.organisation.externalDocumentCount);
          var orgCitationCount = utils.getIntProperty(orgProps, ce.organisation.citationCount);
          var orgType = utils.getProperty(orgProps, ce.organisation.type);

          if (orgType) {
            className = utils.getClassName(orgType);
          }

          csvData.push([id, orgName, orgType, orgEmployeeList.length, orgDocumentCount]);

          // push data to list
          $scope.list.push({
            id:     id,
            name:   orgName,
            value:  orgEmployeeList.length,
            papers: orgDocumentCount,
            externalCount: orgExternalCount,
            citations: orgCitationCount,
            area:   orgType,
            class:  className
          });
        } else if ($scope.listName === $scope.listTypes.topics) {
          // topics page
          var topicProps = instances[id].property_values;

          // topic properties
          var topicDocumentCount = utils.getIntProperty(topicProps, ce.topic.documentCount);

          csvData.push([id, topicDocumentCount]);

          // push data to list
          $scope.list.push({
            id:     id,
            papers: topicDocumentCount
          });
        }
      }

      // add CSV data
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
      } else if ($scope.listName === $scope.listTypes.organisations) {
        csvHeader = ["organisation id", "name", "type", "employee count", "papers count"];
        csvName = "organisations";
      }
      // TODO: add CSV data for coauthors and topics

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
              if (response.results.hasOwnProperty(i)) {
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
      } else if ($scope.listName === $scope.listTypes.organisations) {
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

    if ($stateParams.category) {
      $scope.select($scope.listTypes[$stateParams.category]);
    } else {
      $scope.select($scope.listTypes.papers);
    }
  }]);
