/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals localStorage: true */

angular.module('scienceLibrary')

.directive('itaDocuments', function () {
  'use strict';

  return {
    templateUrl: 'scripts/directives/documents/documents.html',
    restrict: 'E'
  };
});
