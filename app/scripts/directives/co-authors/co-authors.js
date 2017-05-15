/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals localStorage: true */

angular.module('scienceLibrary')

.directive('itaCoAuthors', function () {
  'use strict';

  return {
    templateUrl: 'scripts/directives/co-authors/co-authors.html',
    restrict: 'E'
  };
});
