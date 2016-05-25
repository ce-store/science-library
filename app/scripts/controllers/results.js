'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:ResultsCtrl
 * @description
 * # ResultsCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('ResultsCtrl', ['$scope', '$stateParams', '$http', 'urls', function ($scope, $stateParams, $http, urls) {
    $scope.listLength = 25;

    if ($stateParams.keywords) {
      $scope.keywords = $stateParams.keywords;

      var url = urls.server + urls.ceStore + urls.keywordSearch.keywords + $scope.keywords + urls.keywordSearch.restrictions;
      $http.get(url)
        .then(function(response) {

          $scope.results = [];
          var processedIds = [];

          for (var id in response.data.instances) {
            if (response.data.instances.hasOwnProperty(id)) {
              var instance = response.data.instances[id];
              var concepts = instance.direct_concept_names;
              var properties = instance.property_values;

              if (processedIds.indexOf(id) < 0) {
                var result = {
                  id: id
                };

                if (concepts.indexOf('document') > -1) {
                  result.name = properties.title[0];
                  result.type = 'paper';
                } else if (concepts.indexOf('person') > -1) {
                  result.name = properties['full name'][0];
                  result.type = 'author';
                } else if (concepts.indexOf('organisation') > -1) {
                  result.name = properties.name[0];
                  result.type = 'organistion';
                } else if (concepts.indexOf('topic') > -1) {
                  result.name = properties.marker[0];
                  result.type = 'topic';
                } else if (concepts.indexOf('event') > -1) {
                  result.name = properties['full name'][0];
                  result.type = 'venue';
                }

                $scope.results.push(result);
                processedIds.push(id);
              }
            }
          }

          $scope.instances = response.data.instances;
        }, function(response) {
          console.log('failed: ' + response);
      });
    }
  }]);
