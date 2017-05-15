/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals localStorage: true */

angular.module('scienceLibrary')

.directive('itaOrganisations', function () {
  'use strict';

  return {
    templateUrl: 'scripts/directives/organisations/organisations.html',
    restrict: 'E'
  };
});
