/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('slApp')

.controller('VoiceWarningCtrl', ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
  'use strict';

  $scope.ok = function () {
    $uibModalInstance.close();
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss();
  };
}]);
