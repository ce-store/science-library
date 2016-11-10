/* globals localStorage: true */
/* globals alert: true */

angular.module('itapapersApp')

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
