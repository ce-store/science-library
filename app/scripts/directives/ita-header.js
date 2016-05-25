'use strict';

/**
 * @ngdoc directive
 * @name itapapersApp.directive:itaHeader
 * @description
 * # itaHeader
 */
angular.module('itapapersApp')
  .directive('itaHeader', ['$uibModal', '$location', '$sce', 'localStorageService', 'csv', function ($uibModal, $location, $sce, localStorageService, csv) {
    return {
      templateUrl: 'views/ita-header.html',
      restrict: 'E',
      link: function postLink(scope) {
        scope.getCSVData = function() {
          return csv.getData();
        };

        scope.getCSVHeader = function() {
          return csv.getHeader();
        };

        scope.csvFileName = function() {
          return csv.getName();
        };

        scope.tooltipHTML = function() {
          return $sce.trustAsHtml("Download " + scope.csvFileName());
        };

        scope.reset = function () {
          localStorageService.clearAll();
          localStorage.clear();
        };

        scope.refresh = function() {
          if ($location.url() === '/') {
            location.reload();
          }
        };
      }
    };
  }]);
