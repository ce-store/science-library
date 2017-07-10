/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('scienceLibrary')

.directive('interactiveHeader', ['$parse', function ($parse) {
  'use strict';

  return {
    restrict: 'E',
    templateUrl: 'scripts/directives/interactive-header/interactive-header.html',
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

      scope.$watch(
        function () {
          var header = element[0].querySelector('.interactive-header');
          return header.offsetHeight;
        },
        function (value) {
          if (value !== 0 && value > scope.headerHeight) {
            scope.headerHeight = value;
          }
        }
      );

      scope.$watch('sort', function(newValue) {
        if (newValue) {
          scope.sortList(0);
        }
      }, true);

      scope.sortList(0);
    }
  };
}]);
