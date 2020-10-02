/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('slApp')

.controller('HomeCtrl', function ($scope, urls) {
  'use strict';

  $scope.home = urls.home;
  $scope.scienceLibrary = urls.scienceLibrary;
});
