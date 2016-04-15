'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:ResultsCtrl
 * @description
 * # ResultsCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('ResultsCtrl', ['$scope', '$stateParams', 'hudson', 'debug', function ($scope, $stateParams, hudson, debug) {
    $scope.qa = hudson.getLatestQuestion();
    $scope.listLength = 25;

    if ($stateParams.debug) {
      debug.set($stateParams.debug);
    }

    if ($scope.qa.type === 'list') {
      $scope.list = [{
        name: 'Don',
        value: '12'
      }];
    }
  }]);
