/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('scienceLibrary', [
  'ui.router',
  'ui.bootstrap',
  'uiGmapgoogle-maps',
  'datamaps',
  'ngCsv',
  'LocalStorageModule'
])

.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', 'localStorageServiceProvider', function($stateProvider, $urlRouterProvider, $locationProvider, localStorageServiceProvider) {
  'use strict';

  localStorageServiceProvider
    .setPrefix('scienceLibrary')
    .setStorageCookie(1, '/')
    .setStorageType('sessionStorage')
    .setNotify(true, true);

  $urlRouterProvider.otherwise('/science-library');

  $stateProvider
    .state('home', {
      url: '/science-library',
      templateUrl: 'scripts/routes/home/home.html',
      controller: 'HomeCtrl'
    })
    .state('help', {
      url: '/science-library/help',
      templateUrl: 'views/science-library/help.html',
      controller: 'HelpCtrl'
    })
    .state('author', {
      url: '/science-library/author/:authorId?view',
      templateUrl: 'views/science-library/author.html',
      controller: 'AuthorCtrl'
    })
    .state('paper', {
      url: '/science-library/paper/:paperId',
      templateUrl: 'scripts/routes/document/document.html',
      controller: 'PaperCtrl'
    })
    .state('venue', {
      url: '/science-library/venue/:venueId/:year',
      templateUrl: 'views/science-library/venue.html',
      controller: 'VenueCtrl'
    })
    .state('organisation', {
      url: '/science-library/organisation/:organisationId?view',
      templateUrl: 'views/science-library/organisation.html',
      controller: 'OrganisationCtrl'
    })
    .state('topic', {
      url: '/science-library/topic/:topicId?view',
      templateUrl: 'views/science-library/topic.html',
      controller: 'TopicCtrl'
    })
    .state('project', {
      url: '/science-library/project/:projectId',
      templateUrl: 'views/science-library/project.html',
      controller: 'ProjectCtrl'
    })
    .state('collaboration', {
      url: '/science-library/collaboration?author',
      templateUrl: 'views/science-library/collaboration.html',
      controller: 'CollaborationCtrl'
    })
    .state('results', {
      url: '/science-library/results?keywords',
      templateUrl: 'views/science-library/results.html',
      controller: 'ResultsCtrl'
    })
    .state('statistics', {
      url: '/science-library/statistics',
      templateUrl: 'views/science-library/statistics.html',
      controller: 'StatisticsCtrl'
    })
    .state('compute', {
      url: '/science-library/compute',
      templateUrl: 'views/science-library/compute.html',
      controller: 'ComputeCtrl'
    })
    .state('special', {
      url: '/science-library/special',
      templateUrl: 'views/science-library/special.html',
      controller: 'SpecialCtrl'
    })
    .state('category', {
      url: '/science-library/:category',
      templateUrl: 'scripts/routes/home/home.html',
      controller: 'HomeCtrl'
      // templateUrl: 'views/science-library/main.html',
      // controller: 'MainCtrl'
    });

  $locationProvider.html5Mode(true);
}]);
