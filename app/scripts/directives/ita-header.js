/* globals localStorage: true */

angular.module('itapapersApp')

.directive('itaHeader', ['$uibModal', '$location', '$sce', 'localStorageService', 'csv', function ($uibModal, $location, $sce, localStorageService, csv) {
  'use strict';

  return {
    templateUrl: 'views/ita-header.html',
    restrict: 'E',
    link: function postLink(scope) {
      scope.reset = function () {
        localStorageService.clearAll();
        localStorage.clear();
      };
    }
  };
}]);
