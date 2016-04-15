'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:AddCommentCtrl
 * @description
 * # AddCommentCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('AddCommentCtrl', ['$scope', '$uibModalInstance', 'localStorageService', 'page', 'id', function ($scope, $uibModalInstance, localStorageService, page, id) {

    $scope.type = page;
    $scope.id = id;

    $scope.user = localStorageService.get("user");

    $scope.submit = function() {
      localStorageService.set("user", $scope.user);

      $uibModalInstance.close({
        comment: $scope.comment,
        user: $scope.user
      });
    };
  }]);
