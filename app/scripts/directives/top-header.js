'use strict';

/**
 * @ngdoc directive
 * @name itapapersApp.directive:topHeader
 * @description
 * # topHeader
 */
angular.module('itapapersApp')
  .directive('topHeader', function () {
    return {
      templateUrl: 'views/top-header.html',
      restrict: 'E'
    };
  });
