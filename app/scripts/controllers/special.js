'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:SpecialCtrl
 * @description
 * # SpecialCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('SpecialCtrl', ['$scope', '$stateParams', '$location', 'store', 'urls', 'localStorageService', function ($scope, $stateParams, $location, store, urls, localStorageService) {
    $scope.reset = function () {
      localStorageService.clearAll();
      localStorage.clear();

      alert("localStorage has been cleared");
    };

    $scope.compute = function () {
      $location.path(urls.scienceLibrary + "/compute");
    }
  }]);
