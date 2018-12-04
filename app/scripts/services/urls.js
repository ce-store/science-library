/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('slApp')

.constant('urls', {
  home: 'http://localhost:8080',
  server: 'http://localhost:8080',
  questionAnalyser: '/Hudson/QuestionAnalyser?debug=true',
  interpreter: '/ce-store/special/hudson/interpreter',
  ceStore: '/ce-store/stores/DEFAULT',
  scienceLibrary: 'science-library',
  keywordSearch: {
    keywords: '/ce-store/special/keyword-search?keywords=',
    restrictions: '&returnInstances=true&style=minimal&restrictToConcepts=document,person,organisation,topic,event&restrictToProperties=writes about,abstract,title,name,short name,full name,marker,description'
  }
});
