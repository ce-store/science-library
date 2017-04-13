/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals localStorage: true */
/* globals alert: true */

angular.module('scienceLibrary')

.controller('SpecialCtrl', ['$scope', '$stateParams', '$location', 'store', 'urls', 'localStorageService', function ($scope, $stateParams, $location, store, urls, localStorageService) {
  'use strict';

  $scope.reset = function () {
    localStorageService.clearAll();
    localStorage.clear();

    alert("localStorage has been cleared");
  };

  $scope.compute = function () {
    $location.path(urls.scienceLibrary + "/compute");
  };
}]);
