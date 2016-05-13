'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:ResultsCtrl
 * @description
 * # ResultsCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('ResultsCtrl', ['$scope', '$stateParams', '$http', 'debug', 'server', 'ceStore', 'keywordSearch', function ($scope, $stateParams, $http, debug, server, ceStore, keywordSearch) {
    $scope.listLength = 25;

    if ($stateParams.debug) {
      debug.set($stateParams.debug);
    }

    if ($stateParams.keywords) {
      $scope.keywords = $stateParams.keywords;

      $http.get(server + ceStore + keywordSearch + $scope.keywords)
        .then(function(response) {
          $scope.results = response.data.search_results;
        }, function(response) {
          console.log('failed: ' + response);
      });
    }
  }]);
