/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals localStorage: true */

angular.module('scienceLibrary')

.directive('itaTopics', function () {
  'use strict';

  return {
    templateUrl: 'scripts/directives/topics/topics.html',
    restrict: 'E'
  };
});
