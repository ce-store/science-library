/* globals DOMParser: true */

angular.module('itapapersApp')

.factory('drupal', ['$http', 'urls', function ($http, urls) {
  'use strict';
  var target = 'https://dais-ita.org';

  var loadModel = function() {
    return $http.get('model').then(function(response) {
      var ce = response.data.join('\n');

      return addCE(ce).then(function() {
        return ce;
      });
    });
  };

  var loadDocuments = function() {
    return $http.get('drupal').then(function(response) {
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

      return addCE(ce).then(function() {
        return ce;
      });
    });
  };

  var loadRules = function() {
    return $http.get('rules').then(function(response) {
      console.log(response);
      var ce = response.data;

      return addCE(ce).then(function() {
        return ce;
      });
    });
  };

  var addCE = function(ce) {
    var ceStore = urls.server + urls.ceStore + '/sources/generalCeForm?showStats=true&action=save';

    return $http.post(ceStore, ce);
  };

  return {
    loadModel: loadModel,
    loadDocuments: loadDocuments,
    loadRules: loadRules
  };
}]);
