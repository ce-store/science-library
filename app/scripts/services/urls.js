/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('itapapersApp')

.constant('urls', {
  home: 'sl.dais-ita.org',
  server: 'sl.dais-ita.org',
  questionAnalyser: '/Hudson/QuestionAnalyser?debug=true',
  interpreter: '/ce-store/special/hudson/interpreter',
  ceStore: '/ce-store/stores/DEFAULT',
  scienceLibrary: 'science-library',
  keywordSearch: {
    keywords: '/special/keyword-search?keywords=',
    restrictions: '&returnInstances=true&style=minimal&restrictToConcepts=document,person,organisation,topic,event&restrictToProperties=writes about,abstract,title,name,short name,full name,marker,description'
  }
});
