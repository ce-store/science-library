/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals localStorage: true */

angular.module('scienceLibrary')

.directive('itaVenues', function () {
  'use strict';

  return {
    templateUrl: 'scripts/directives/venues/venues.html',
    restrict: 'E'
  };
});