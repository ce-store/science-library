/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('itapapersApp')

.directive('topHeader', ['$parse', function ($parse) {
  'use strict';

  return {
    restrict: 'E',
    templateUrl: 'views/science-library/top-header.html',
    link: function postLink(scope, element, attrs) {
      var expHeader = $parse(attrs.headertext);
      scope.header = expHeader(scope);

      scope.$watchCollection(expHeader, function(header) {
        scope.header = header;
      });

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
}]);
