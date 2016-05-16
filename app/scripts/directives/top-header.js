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
          if (scope.sort && scope.sort.names) {
            scope.sortName = scope.sort.names[i];
            scope.sortValue = scope.sort.values[i];
            scope.sortCommand = scope.sort.reverse[i] + scope.sort.values[i];
            scope.sortShow = scope.sort.show[i];
            if (scope.change) {
              scope.change();
            }
          }
        };

        scope.$watch('sort', function(newValue, oldValue) {
          if (newValue) {
            scope.sortList(0);
          }
        }, true);

        scope.sortList(0);
      }
    };
  });
