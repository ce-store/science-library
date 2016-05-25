'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.urls
 * @description
 * # urls
 * Constant in the itapapersApp.
 */
angular.module('itapapersApp')
  .constant('urls', {
    home: 'http://localhost:3000',
    server: 'http://localhost:8080',
  // .constant('server', 'http://nis-ita.org')
    questionAnalyser: '/Hudson/QuestionAnalyser?debug=true',
  // .constant('hudson', '/ITAHudson/QuestionAnalyser?debug=true')
    ceStore: '/ce-store/stores/DEFAULT',
  // .constant('store', '/ce-store/stores/extonly')
    scienceLibrary: 'ScienceLibrary',
  // .constant('scienceLibrary', 'NewScienceLibrary')
    keywordSearch: {
      keywords: '/special/keyword-search?keywords=',
      restrictions: '&returnInstances=true&restrictToConcepts=document,person,organisation,topic,event&restrictToProperties=writes about,abstract,title,name,short name,full name,marker,description'
    }
  });
