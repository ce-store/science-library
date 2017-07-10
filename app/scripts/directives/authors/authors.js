/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals localStorage: true */

angular.module('scienceLibrary')

.directive('itaAuthors', function () {
  'use strict';

  return {
    templateUrl: 'scripts/directives/authors/authors.html',
    restrict: 'E',
    link: function postLink(scope, element) {
      scope.$watch(
        function () {
          var buttons = element[0].querySelector('.chart-btns');
          return buttons.offsetHeight
        },
        function (value) {
          if (value !== 0) {
            scope.scatterButtonsHeight = value;
          }
        }
      );
    }
  };
});
