/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals window: true */

angular.module('itapapersApp')

.controller('VenueCtrl', ['$scope', '$stateParams', 'store', 'hudson', 'colours', 'documentTypes', 'utils', 'csv', 'urls', 'definitions', function ($scope, $stateParams, store, hudson, colours, documentTypes, utils, csv, urls, ce) {
  'use strict';

  $scope.scienceLibrary = urls.scienceLibrary;
  $scope.map = {};
  $scope.multiplier = 8;
  var bubblesData   = {};
  var arcData       = {};
  var papersData    = {};
  var authorsData   = {};
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
      borderWidth: 1,
      borderColor: '#22394A',
      highlightBorderWidth: 0,
      highlightFillColor: '#84c142'
    },
    arcConfig: {
      strokeColor: '#41D6C3',
      strokeWidth: 2,
      arcSharpness: 1,
      animationSpeed: 1000
    },
    fills: {
      defaultFill: "#f0f0f0",
      'EVENT': '#fde876',
      'AC': colours.areas[0],
      'IND': colours.areas[1],
      'GOV': colours.areas[2]
    }
  };

  store.getEventSeriesDetails($stateParams.venueId)
    .then(function(data) {
      var eventBubbles = {};
      var es = data.main_instance;
      var esId = es._id;
      var evIds = utils.getListProperty(es.property_values, ce.series.eventList);

      for (var i = 0; i < evIds.length; ++i) {
        var evId = evIds[i];
        var ev = data.related_instances[evId];
        var evLocId = utils.getProperty(ev.property_values, ce.venue.location);
        var evLoc = data.related_instances[evLocId];

        var docIds = utils.getListProperty(ev.property_values, ce.venue.documentList);

        for (var j = 0; j < docIds.length; ++j) {
          var docId = docIds[j];
          var doc = data.related_instances[docId];

          var oaIds = utils.getListProperty(doc.property_values, ce.paper.authorList);

          for (var k = 0; k < oaIds.length; ++k) {
            var oaId = oaIds[k];
            var oa = data.related_instances[oaId];

            var perId = utils.getProperty(oa.property_values, ce.orderedAuthor.person);
            var per = data.related_instances[perId];

            var orgId = utils.getProperty(oa.property_values, ce.orderedAuthor.organisation);
            var org = data.related_instances[orgId];

            var orgLocId = utils.getProperty(org.property_values, ce.organisation.location);
            var orgLoc = data.related_instances[orgLocId];

            doBubbleProcessing(eventBubbles, es, ev, evLoc, doc, per, org, orgLoc);
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

      refreshHighlight();
  });

  function doBubbleProcessing(eventBubbles, es, ev, evLoc, doc, per, org, orgLoc) {
    var found = false;
    var eventSeriesId = es._id;
    var eventYearId = ev._id;
    var eventLocationId = evLoc._id;
    var paperId = doc._id;
    var authorId = per._id;
    var organisationId = org._id;
    var organisationLocationId = orgLoc._id;

    var authorProps = per.property_values;
    var eventLocProps = evLoc.property_values;
    var orgLocProps = orgLoc.property_values;

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
      var seriesProps = es.property_values;
      var yearProps = ev.property_values;

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
    }

    if (!found) {
      var orgProps = org.property_values;

      // organisation properties
      var orgName = utils.getUnknownProperty(orgProps, ce.organisation.name);
      var orgType = utils.getIndustryFor(org);

      var bubble = {
        id:         organisationId,
        name:       orgName,
        latitude:   orgLat,
        longitude:  orgLon,
        radius:     $scope.multiplier,
        fillKey:    orgType,
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

    var paperProps = doc.property_values;

    // paper properties
    var paperName = utils.getUnknownProperty(paperProps, ce.paper.title);
    var paperType = utils.getType(doc.concept_names);
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
}]);
