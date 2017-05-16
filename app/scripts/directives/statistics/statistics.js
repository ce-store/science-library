/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals localStorage: true */

angular.module('scienceLibrary')

.directive('itaStatistics', function () {
  'use strict';

  return {
    templateUrl: 'scripts/directives/statistics/statistics.html',
    restrict: 'E'
  };
});
