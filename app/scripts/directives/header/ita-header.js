/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals localStorage: true */

angular.module('scienceLibrary')

.directive('itaHeader', ['localStorageService', function (localStorageService) {
  'use strict';

  return {
    templateUrl: 'scripts/directives/header/ita-header.html',
    restrict: 'E',
    link: function postLink(scope) {
      scope.reset = function () {
        localStorageService.clearAll();
        localStorage.clear();
      };
    }
  };
}]);
