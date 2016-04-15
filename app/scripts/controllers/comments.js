'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:CommentsCtrl
 * @description
 * # CommentsCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('CommentsCtrl', ['$scope', '$stateParams', 'store', 'debug', function ($scope, $stateParams, store, debug) {
    $scope.comments = [];
    $scope.issues = [];
    var unknown = "unknown";

    if ($stateParams.debug) {
      debug.set($stateParams.debug);
    }

    store.getComments()
      .then(function(comments) {
        for (var i = 0; i < comments.length; ++i) {
          var properties = comments[i].property_values;
          var user = properties["was raised by"] ? properties["was raised by"][0] : unknown;
          var comment = properties.text ? properties.text[0] : unknown;
          var id = properties["applies to"] ? properties["applies to"][0] : unknown;
          var url = properties.url ? properties.url[0] : null;

          if (url) {
            var firstChar = url.charAt(0);
            if (firstChar === "/") {
              url = url.substring(1);
            }
          }

          $scope.comments.push({
            user: user,
            comment: comment,
            id: id,
            url: url
          });
        }
      });

    store.getIssues()
      .then(function(issues) {
        for (var i = 0; i < issues.length; ++i) {
          var properties = issues[i].property_values;
            var user = properties["was raised by"] ? properties["was raised by"][0] : unknown;
            var comment = properties.text ? properties.text[0] : unknown;

          $scope.issues.push({
              user: user,
              comment: comment
            });
        }
      });
  }]);
