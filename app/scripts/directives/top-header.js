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
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        scope.sortList = function(i) {
          scope.sortName = scope.sort.names[i];
          scope.sortValue = scope.sort.values[i];
          scope.change();
        };

        scope.sortList(0);
      }
    };
  });
