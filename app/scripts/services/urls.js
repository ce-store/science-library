'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.urls
 * @description
 * # urls
 * Constant in the itapapersApp.
 */
angular.module('itapapersApp')
  .constant('server', 'http://localhost:8080')
  // .constant('server', 'http://159.8.5.67')
  .constant('questionAnalyser', '/Hudson/QuestionAnalyser?debug=true')
  // .constant('hudson', '/ITAHudson/QuestionAnalyser?debug=true')
  .constant('ceStore', '/ce-store/stores/DEFAULT')
  // .constant('store', '/ce-store/stores/extonly')
  .constant('keywordSearch', {
    keywords: '/special/keyword-search?keywords=',
    restrictions: '&returnInstances=true&restrictToConcepts=document,person,organisation,topic,event&restrictToProperties=writes about,abstract,title,name,short name,full name,marker,description'
  });
