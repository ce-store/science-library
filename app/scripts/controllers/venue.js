'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:VenueCtrl
 * @description
 * # VenueCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('VenueCtrl', ['$scope', '$stateParams', 'store', 'hudson', 'colours', 'documentTypes', 'utils', 'csv', 'definitions', function ($scope, $stateParams, store, hudson, colours, documentTypes, utils, csv, ce) {
    $scope.map = {};
    $scope.multiplier = 3;
    var bubblesData   = {};
    var arcData       = {};
    var papersData    = {};
    var authorsData   = {};
    var csvDataYears  = {};
    var lastHighlight = null;

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

    $scope.select = function (year) {
      $scope.selectedYear = year;
      $scope.map.pluginData = {
        bubbles: bubblesData[year],
        arc: arcData[year]
      };
      $scope.papers  = papersData[year];
      $scope.authors = authorsData[year];
      $scope.bubbles = bubblesData[year];

      var thisEvent    = bubblesData[year][bubblesData[year].length - 1];
      $scope.startDate = thisEvent.startDate;
      $scope.endDate   = thisEvent.endDate;
      $scope.url       = thisEvent.url;

      csv.setData(csvDataYears[year]);
    };

    // get window size
    $scope.width = window.innerWidth;
    $scope.height = window.innerHeight;

    // set height of map
    var venueMapElem = angular.element("#venue-map");
    var height = $scope.height - 220;
    venueMapElem.css("height", height + "px");

    // set max-height of mini results lists
    var miniListElems = angular.element(".mini");
    var maxHeight = ($scope.height - 520) * 0.33;
    miniListElems.css("max-height", maxHeight + "px");

    // Draw map
    $scope.map.world = {
      scope: 'world',
      projection: 'mercator',
      geographyConfig: {
        borderWidth: 1,
        borderColor: '#293e4c',
        highlightBorderColor: '#01a8ca',
        highlightFillColor: '#fff'
      },
      bubblesConfig: {
        borderWidth: 0,
        highlightBorderWidth: 0,
        highlightFillColor: '#84c142'
      },
      arcConfig: {
        strokeColor: '#fde876',
        strokeWidth: 1,
        arcSharpness: 1,
        animationSpeed: 1000
      },
      fills: {
        defaultFill: "#f0f0f0",
        'EVENT': '#fde876',
        'AC': colours.AC,
        'IND': colours.IND,
        'GOV': colours.GOV
      }
    };

    store.getEventSeriesDetails()
      .then(function(data) {
        var instances = data.instances;
        var eventBubbles = {};

        for (var i = 0; i < data.results.length; ++i) {
          var d = data.results[i];
          var found = false;

          // get instance ids
          var paperId = d[0];
          var authorId = d[1];
          var eventYearId = d[2];
          var eventSeriesId = d[3];
          var organisationId = d[4];
          var organisationLocationId = d[5];
          var eventLocationId = d[6];
          var citationId = d[7];

          // Filter other event series
          if (eventSeriesId === $stateParams.venueId) {
            var authorProps = instances[authorId].property_values;
            var eventLocProps = instances[eventLocationId].property_values;
            var orgLocProps = instances[organisationLocationId].property_values;

            // author properties
            var authorName = utils.getUnknownProperty(authorProps, ce.author.fullName);

            // event location properties
            var eventLat = utils.getProperty(eventLocProps, ce.location.lat);
            var eventLon = utils.getProperty(eventLocProps, ce.location.lon);

            // organisation location properties
            var orgLat = utils.getProperty(orgLocProps, ce.location.lat);
            var orgLon = utils.getProperty(orgLocProps, ce.location.lon);

            // Sort bubbles
            if (bubblesData[eventYearId]) {
              for (var j = 0; j < bubblesData[eventYearId].length && !found; ++j) {
                var bubbleForYear = bubblesData[eventYearId][j];

                if (bubbleForYear.id === organisationId) {
                  bubbleForYear.radius += $scope.multiplier;
                  bubbleForYear.authors.push({
                    id:   authorId,
                    name: authorName
                  });

                  if (authorsData[eventYearId][authorId]) {
                    authorsData[eventYearId][authorId].count++;
                  } else {
                    authorsData[eventYearId][authorId] = {
                      id:   authorId,
                      name: authorName,
                      count: 1
                    };
                  }

                  found = true;
                }
              }
            } else {
              var seriesProps = instances[eventSeriesId].property_values;
              var yearProps = instances[eventYearId].property_values;

              // event series properties
              var seriesName = utils.getUnknownProperty(seriesProps, ce.series.name);
              var seriesYears = utils.getUnknownProperty(seriesProps, ce.series.years);

              // venue properties
              var venueName = utils.getUnknownProperty(yearProps, ce.venue.name);
              var venueLocation = utils.getUnknownProperty(yearProps, ce.venue.location);
              var venueStartDate = utils.getUnknownProperty(yearProps, ce.venue.startDate);
              var venueEndDate = utils.getUnknownProperty(yearProps, ce.venue.endDate);
              var venueUrl = utils.getProperty(yearProps, ce.venue.url);

              $scope.venueName = seriesName;
              $scope.yearsRan = seriesYears;

              var eventBubble = {
                name:       venueName + ": " + venueLocation,
                location:   eventLocationId,
                startDate:  venueStartDate,
                endDate:    venueEndDate,
                url:        venueUrl,
                radius:     $scope.multiplier * 5,
                latitude:   eventLat,
                longitude:  eventLon,
                fillKey:    'EVENT'
              };

              eventBubbles[eventYearId] = eventBubble;
              bubblesData[eventYearId]  = [];
              authorsData[eventYearId]  = {};
              csvDataYears[eventYearId] = [$stateParams.venueId, $stateParams.year, $scope.venueName, $scope.yearsRan, venueName, venueLocation, eventLat, eventLon, venueStartDate, venueEndDate, venueUrl];
            }

            if (!found) {
              var orgProps = instances[organisationId].property_values;

              // organisation properties
              var orgName = utils.getUnknownProperty(orgProps, ce.organisation.name);
              var orgAffiliation = utils.getUnknownProperty(orgProps, ce.organisation.affiliation);

              var bubble = {
                id:         organisationId,
                name:       orgName,
                latitude:   orgLat,
                longitude:  orgLon,
                radius:     $scope.multiplier,
                fillKey:    orgAffiliation,
                authors: [{
                  id: authorId,
                  name: authorName
                }]
              };

              bubblesData[eventYearId].push(bubble);

              if (authorsData[eventYearId][authorId]) {
                authorsData[eventYearId][authorId].count++;
              } else {
                authorsData[eventYearId][authorId] = {
                  id:   authorId,
                  name: authorName,
                  count: 1
                };
              }
            }

            // Sort arcs
            if (!arcData[eventYearId]) {
              arcData[eventYearId] = [];
            }

            var arc = {
              origin: {
                latitude:   orgLat,
                longitude:  orgLon
              },
              destination: {
                latitude:   eventLat,
                longitude:  eventLon
              }
            };

            arcData[eventYearId].push(arc);

            var paperProps = instances[paperId].property_values;

            // paper properties
            var paperName = utils.getUnknownProperty(paperProps, ce.paper.title);
            var paperType = utils.getType(instances[paperId].direct_concept_names);
            var paperCitationCount = utils.getIntProperty(paperProps, ce.paper.citationCount);

            // Sort papers
            var paper = {
              id:         paperId,
              name:       paperName,
              citations:  paperCitationCount,
              type:       paperType,
              class:      utils.getClassName(paperType)
            };

            if (papersData[eventYearId]) {
              found = false;
              for (var k = 0; k < papersData[eventYearId].length; ++k) {
                if (papersData[eventYearId][k].id === paperId) {
                  found = true;
                }
              }

              if (!found) {
                papersData[eventYearId].push(paper);
              }
            } else {
              papersData[eventYearId] = [];
              papersData[eventYearId].push(paper);
            }
          }
        }

        // add event bubbles on top
        for (var year in eventBubbles) {
          if (eventBubbles.hasOwnProperty(year)) {
            bubblesData[year].push(eventBubbles[year]);
          }
        }

        // Set elements
        $scope.years = Object.keys(bubblesData);
        $scope.selectedYear = $scope.years[0];

        if ($stateParams.year) {
          $scope.selectedYear = $stateParams.year;
        }

        $scope.select($scope.selectedYear);

        $scope.map.plugins = {
          bubbles: null,
          arc: null
        };
        $scope.map.pluginData = {
          bubbles: bubblesData[$scope.selectedYear],
          arc: arcData[$scope.selectedYear]
        };

        csv.setHeader(["event series id", "event series year", "event series name", "years ran", "event name", "event location", "latitude", "longitude", "start date", "end date", "url"]);
        csv.setName($stateParams.venueId + "_" + $stateParams.year);
        refreshHighlight();
    });
  }]);
