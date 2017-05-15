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
    restrict: 'E'
  };
});
