angular.module('itapapersApp')

.controller('VoiceWarningCtrl', ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
  'use strict';

  $scope.ok = function () {
    $uibModalInstance.close();
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss();
  };
}]);
