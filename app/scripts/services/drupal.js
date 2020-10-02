/* globals DOMParser: true */

angular.module('slApp')

.factory('drupal', ['$http', function ($http) {
  'use strict';

  var loadModel = function() {
    return $http.get('drupal/model').then(function(response) {
      var ce = response.data.join('\n');

      return addCE(ce).then(function(response) {
        return response;
      });
    });
  };

  var loadDocuments = function() {
    return $http.get('drupal/documents').then(function(response) {
      var documents = response.data;
      var ce = '';

      for (var i in documents) {
        var doc = documents[i];

        var parser = new DOMParser();
        var html = parser.parseFromString(doc, 'text/html');
        var element = html.getElementById('controlled-english-section');

        if (element) {
          var innerHTML = element.innerHTML;
          var formatted = innerHTML.replace(new RegExp('<br>', 'g'), '\n');

          ce += formatted;
        }
      }

      return addCE(ce).then(function(response) {
        return response;
      });
    });
  };

  var loadRules = function() {
    return $http.get('drupal/rules').then(function(response) {
      var ce = response.data;

      return addCE(ce).then(function(response) {
        return response;
      });
    });
  };

  var addCE = function(ce) {
    return $http.post('ce/save', { ce: encodeURIComponent(ce) });
  };

  return {
    loadModel: loadModel,
    loadDocuments: loadDocuments,
    loadRules: loadRules
  };
}]);
