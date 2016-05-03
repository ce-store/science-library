'use strict';

/**
 * @ngdoc directive
 * @name itapapersApp.directive:itaHeader
 * @description
 * # itaHeader
 */
angular.module('itapapersApp')
  .directive('itaHeader', ['$uibModal', '$location', '$sce', 'localStorageService', 'debug', 'server', 'csv', function ($uibModal, $location, $sce, localStorageService, debug, server, csv) {
    return {
      templateUrl: 'views/ita-header.html',
      restrict: 'E',
      link: function postLink(scope) {
        scope.$on('debug', function() {
          scope.debug = debug.getState() === "true";
        });

        scope.getCSVData = function() {
          return csv.getData();
        };

        scope.getCSVHeader = function() {
          return csv.getHeader();
        };

        scope.csvFileName = function() {
          return csv.getName();
        };

        scope.tooltipHTML = function() {
          return $sce.trustAsHtml("Download " + scope.csvFileName());
        };

        scope.addComment = function (size) {
          var url = $location.url();
          var split = url.split("/");
          scope.page = split[1];
          if (split[2]) {
            scope.id = split[2].split("?")[0];
          }

          var modalInstance = $uibModal.open({
            animation: scope.animationsEnabled,
            templateUrl: 'views/add-comment.html',
            controller: 'AddCommentCtrl',
            size: size,
            resolve: {
              page: function() {
                return scope.page;
              },
              id: function () {
                return scope.id;
              }
            }
          });

          var matchType = function (type) {
            if (type === "paper") {
              return "document";
            } else if (type === "venue") {
              return "event series";
            } else if (type === "project") {
              return "project";
            } else if (type === "author") {
              return "person";
            } else {
              return type;
            }
          };

          modalInstance.result.then(function (result) {
            var user = result.user ? result.user : "default";

            var ce = "the comment 'com_{uid}'\n" +
              "  has '" + url + "' as url and\n";

            if (scope.id) {
              ce += "  applies to the " + matchType(scope.page) + " '" + scope.id + "' and\n";
            }

            ce += "  has '" + result.comment + "' as text and\n" +
              "  was raised by the user '" + user + "'.";

            console.log(ce);
            addCE(ce);
          });
        };

        scope.reset = function () {
          localStorageService.clearAll();
          localStorage.clear();
        };

        scope.refresh = function() {
          if ($location.url() === '/') {
            location.reload();
          }
        };

        var addCE = function (ce) {
          //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/DEFAULT/sources/generalCeForm?showStats=true&action=save";

          $.ajax({
            type: "POST",
            url: url,
            data: ce,
            contentType: "text/plain;charset=UTF-8"
          });
        };
      }
    };
  }]);
