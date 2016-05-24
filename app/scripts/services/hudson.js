'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.results
 * @description
 * # results
 * Factory in the itapapersApp.
 */
angular.module('itapapersApp')
  .factory('hudson', ['$http', '$location', '$rootScope', 'server', 'questionAnalyser', 'ceStore', 'keywordSearch', function ($http, $location, $rootScope, server, questionAnalyser, ceStore, keywordSearch) {
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

    var saveQuestion = function(question, type, property) {
      var qa;

      if (type === 'highlight') {
        qa = {
          question: question,
          type: type,
          property: property
        };
      } else if (type === 'redirect') {
        qa = {
          question: question,
          type: type
        };
      }

      questions.push(qa);
      $rootScope.$broadcast('question:added');
    };

    var hasUsefulConceptName = function (instance) {
      return instance.direct_concept_names.indexOf(types.document) > -1 ||
        instance.direct_concept_names.indexOf(types.person) > -1 ||
        instance.direct_concept_names.indexOf(types.eventSeries) > -1 ||
        instance.direct_concept_names.indexOf(types.event) > -1 ||
        instance.direct_concept_names.indexOf(types.organisation) > -1 ||
        instance.direct_concept_names.indexOf(types.topic) > -1 ||
        instance.direct_concept_names.indexOf(types.project) > -1;
    };

    var getUrl = function(type, instance) {
      var url;

      if (type === types.document) {
        url = '/paper/' + instance._id;
      } else if (type === types.person) {
        url = '/author/' + instance._id;
      } else if (type === types.eventSeries) {
        url = '/venue/' + instance._id + '/';
      } else if (type === types.event) {
        url = '/venue/' + instance.property_values['is part of'][0] + '/' + instance._id;
      } else if (type === types.topic) {
        url = '/topic/' + instance._id;
      } else if (type === types.organisation) {
        url = '/organisation/' + instance._id;
      } else if (type === types.project) {
        url = '/project/' + instance._id;
      }

      return url;
    };

    var handleAnswer = function (data) {
      var propertyName;
      var domainName;
      var instance;
      var type;
      var word;
      var url;

      // get property
      for (var property in data.properties) {
        if (data.properties[property].length > 0) {
          propertyName = data.properties[property][0].property_name;
          domainName = data.properties[property][0].domain_name;

          if (domainName.indexOf(types.document) > -1) {
            type = types.document;
          } else if (domainName.indexOf(types.person) > -1) {
            type = types.person;
          } else if (domainName.indexOf(types.eventSeries) > -1) {
            type = types.eventSeries;
          } else if (domainName.indexOf(types.event) > -1) {
            type = types.event;
          } else if (domainName.indexOf(types.organisation) > -1) {
            type = types.organisation;
          } else if (domainName.indexOf(types.topic) > -1) {
            type = types.topic;
          } else if (domainName.indexOf(types.project) > -1) {
            type = types.project;
          }
        }
      }

      // highlight
      if (propertyName) {
        for (word in data.instances) {
          if (data.instances.hasOwnProperty(word)) {
            for (var i = 0; i < data.instances[word].length; ++i) {
              if (data.instances[word][i].direct_concept_names.indexOf(type) > -1 ||
                data.instances[word][i].inherited_concept_names.indexOf(type) > -1) {
                instance = data.instances[word][i];
                break;
              }
            }
          }
        }

        url = getUrl(type, instance);
        $location.url(url);

        saveQuestion(data.question_text, "highlight", propertyName.replace(/ /g, '_'));
      // redirect
      } else {
        var insts = data.answer_instances ? data.answer_instances : data.instances;

        for (word in insts) {
          if (insts.hasOwnProperty(word)) {
            var inst;
            if (insts[word][0]) {
              inst = insts[word][0];
            } else {
              inst = insts[word];
            }

            if (hasUsefulConceptName(inst)) {
              instance = inst;
              break;
            }
          }
        }

        if (instance) {
          // get url
          if (instance.direct_concept_names.indexOf(types.document) > -1) {
            url = '/paper/' + instance._id;
          } else if (instance.direct_concept_names.indexOf(types.person) > -1) {
            url = '/author/' + instance._id;
          } else if (instance.direct_concept_names.indexOf(types.eventSeries) > -1) {
            url = '/venue/' + instance._id + '/';
          } else if (instance.direct_concept_names.indexOf(types.event) > -1) {
            url = '/venue/' + instance.property_values['is part of'][0] + '/' + instance._id;
          } else if (instance.direct_concept_names.indexOf(types.organisation) > -1) {
            url = '/organisation/' + instance._id;
          } else if (instance.direct_concept_names.indexOf(types.topic) > -1) {
            url = '/topic/' + instance._id;
          } else if (instance.direct_concept_names.indexOf(types.project) > -1) {
            url = '/project/' + instance._id;
          }

          $location.url(url);
          saveQuestion(data.question_text, 'redirect');
        }
      }
    };

    var askQuestion = function (question) {
      var words = question.split(' ');
      var questionWords = ['what', 'who', 'list', 'show', 'draw'];

      if (words.indexOf('help') > -1) {
        $location.url('help');
      } else if (questionWords.indexOf(words[0]) > -1) {
        // Question - send to Hudson
        $http.post(server + questionAnalyser, question)
          .then(function(response) {
            handleAnswer(response.data);
          }, function(response) {
            console.log('failed: ' + response);
        });
      } else {
        $location.url('results?keywords=' + question);
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
