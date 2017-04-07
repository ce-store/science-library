/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals window: true */

angular.module('itapapersApp')

.controller('ResultsCtrl', ['$scope', '$stateParams', '$http', 'urls', 'definitions', function ($scope, $stateParams, $http, urls, ce) {
  'use strict';

  $scope.scienceLibrary = urls.scienceLibrary;
  $scope.listLength = 10;

  if ($stateParams.keywords) {
    $scope.keywords = $stateParams.keywords;

    $http.get('ce-store/keywords/' + $scope.keywords)
      .then(function(response) {

        $scope.results = {
          papers: [],
          authors: [],
          organisations: [],
          topics: [],
          venues: []
        };

        var allResults = {};
        var lastResult = null;
        var matches = 0;

        for (var id in response.data.search_results) {
          var sr = response.data.search_results[id];
          var instId = sr.instance_name;
          var instance = response.data.instances[instId];
          var concepts = instance.concept_names;
          var properties = instance.property_values;

          if (!allResults[instId]) {
            var result = {
              id: instId,
              context: sr.property_name
            };

            if (concepts.indexOf(ce.concepts.document) > -1) {
              result.name = properties.title[0];
              result.type = 'paper';
              $scope.results.papers.push(result);
            } else if (concepts.indexOf(ce.concepts.person) > -1) {
              result.name = properties[ce.author.fullName][0];
              result.type = 'author';
              $scope.results.authors.push(result);
            } else if (concepts.indexOf(ce.concepts.organisation) > -1) {
              result.name = properties.name[0];
              result.type = 'organisation';
              $scope.results.organisations.push(result);
            } else if (concepts.indexOf(ce.concepts.topic) > -1) {
              result.name = properties.marker[0];
              result.type = 'topic';
              $scope.results.topics.push(result);
            } else if (concepts.indexOf(ce.concepts.event) > -1) {
              result.name = instId + ': ';
              result.name += properties[ce.venue.name][0];
              result.type = 'venue';
              $scope.results.venues.push(result);
            } else {
              console.log('Unhandled concept for');
              console.log(instance);
            }

            allResults[instId] = result;
            lastResult = result;
            ++matches;
          } else {
            allResults[instId].context += ', ' + sr.property_name;
          }
        }

        $scope.instances = response.data.instances;

        if (matches === 1) {
          var url = urls.scienceLibrary + '/' + lastResult.type + '/' + lastResult.id;
          window.location.href = url;
        }
      }, function(response) {
        console.log('failed: ' + response);
      });
  }
}]);
