'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('HomeCtrl', function ($scope, urls) {
    $scope.home = urls.home;
    $scope.scienceLibrary = urls.scienceLibrary;
  });
