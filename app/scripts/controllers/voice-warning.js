'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:VoiceWarningCtrl
 * @description
 * # VoiceWarningCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('VoiceWarningCtrl', ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
    $scope.ok = function () {
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss();
    };
  }]);
