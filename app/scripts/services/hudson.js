angular.module('itapapersApp')

.factory('hudson', ['$http', '$location', '$rootScope', '$state', 'urls', function ($http, $location, $rootScope, $state, urls) {
  'use strict';

  var questions = [];
  var types = {
    document: 'document',
    person: 'person',
    event: 'event',
    eventSeries: 'event series',
    organisation: 'organisation',
    topic: 'topic',
    project: 'project'
  };
  var conceptPageMap = {
    'document': 'paper',
    'person': 'author',
    'event': 'venue',
    'event series': 'venue',
    'organisation': 'organisation',
    'topic': 'topic',
    'project': 'project'
  };
  var renderableTriples = {
    'organisation': [
      'employs',
      'wrote'
    ]
  };
  var matchedTriple = 'matched-triple';
  var multiMatch = 'multi-match';

  var goTo = function(concept, id, year) {
    var page = conceptPageMap[concept];
    var params = {};
    params[page + 'Id'] = id;

    if (year) {
      params.year = year;
    }

    $state.go(page, params);
    return true;
  };

  var handleSpecials = function(specials) {
    for (var i = 0; i < specials.length; ++i) {
      var special = specials[i];

      if (special.type === matchedTriple) {
        if (special.predicate) {
          var entities = special.predicate.entities;
          for (var j = 0; j < entities.length; ++j) {
            var entity = entities[j];
            var triples = renderableTriples[entity.domain];

            if (special['subject instances'] &&
                triples.includes(entity['property name'])) {
              var subject = special['subject instances'][0].entities[0];
              return goTo(entity.domain, subject._id);
              // TODO: Extend goTo to show subpage, eg. org employs
            }
          }
        }
      } else if (special.type === multiMatch) {

      }
    }
  };

  var handleInstances = function(instances) {
    var matchesConcept = function(concept) {
      return conceptPageMap[concept];
    };

    var eventSeriesFound = false;

    for (var i = 0; i < instances.length; ++i) {
      var instance = instances[i];

      for (var j = 0; j < instance.entities.length; ++j) {
        var entity = instance.entities[j];
        var concept = entity._concept.find(matchesConcept);

        if (concept) {
          if (concept === types.eventSeries) {
            eventSeriesFound = entity._id;
          } else if (concept === types.event) {
            eventSeriesFound = false;
            return goTo(concept, entity['is part of'], entity._id);
          } else {
            return goTo(concept, entity._id);
          }
        }
      }
    }

    if (eventSeriesFound) {
      return goTo(types.eventSeries, eventSeriesFound);
    }
  };

  var handleConcepts = function(concepts) {
    console.log(concepts);
    for (var i = 0; i < concepts.length; ++i) {
      var concept = concepts[i];

      for (var j = 0; j < concept.entities.length; ++j) {
        var entity = concept.entities[j];
        var page = conceptPageMap[entity._id];

        if (page && page !== conceptPageMap.project) {
          $state.go('category', {category: page + 's'});
          return true;
        }
      }
    }
  };

  var handleIntepretations = function(interpretations) {
    if (interpretations && interpretations.length > 0) {
      var result = interpretations[0].result;
      var redirected;

      // perform special lookup
      if (result.specials) {
        redirected = handleSpecials(result.specials);
      }

      // go to instance
      if (!redirected && result.instances) {
        redirected = handleInstances(result.instances);
      }

      // go to list
      if (!redirected && result.concepts) {
        redirected = handleConcepts(result.concepts);
      }

      if (!redirected && result.properties) {
      }

      return redirected;
    }
  };

  var askQuestion = function (question) {
    var url = urls.scienceLibrary;

    if (question.includes('help')) {
      $state.go('help');
    } else {
      $http.post(urls.server + urls.interpreter, question)
        .then(function(response) {
          console.log(response);
          var redirected = handleIntepretations(response.data.interpretations);

          // keyword search
          if (!redirected) {
            $state.go('results', {keywords: question});
          }
        }, function(response) {
          console.log(response);
        });
    }
  };

  var getLatestQuestion = function () {
    if (questions.length > 0) {
      return questions.pop();
    }
  };

  return {
    askQuestion: askQuestion,
    getLatestQuestion: getLatestQuestion
  };
}]);
