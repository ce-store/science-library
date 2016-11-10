angular.module('itapapersApp')

.controller('HomeCtrl', function ($scope, urls) {
  'use strict';

  $scope.home = urls.home;
  $scope.scienceLibrary = urls.scienceLibrary;
});
