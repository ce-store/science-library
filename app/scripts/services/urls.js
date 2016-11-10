angular.module('itapapersApp')

.constant('urls', {
  home: 'http://localhost:8080',
  server: 'http://localhost:8080',
  questionAnalyser: '/Hudson/QuestionAnalyser?debug=true',
  ceStore: '/ce-store/stores/DEFAULT',
  scienceLibrary: 'science-library',
  keywordSearch: {
    keywords: '/special/keyword-search?keywords=',
    restrictions: '&returnInstances=true&style=minimal&restrictToConcepts=document,person,organisation,topic,event&restrictToProperties=writes about,abstract,title,name,short name,full name,marker,description'
  }
});
