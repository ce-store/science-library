'use strict';

/**
 * @ngdoc overview
 * @name itapapersApp
 * @description
 * # itapapersApp
 *
 * Main module of the application.
 */
angular
  .module('itapapersApp', [
    'ui.router',
    'ui.bootstrap',
    'uiGmapgoogle-maps',
    'datamaps',
    'ngCsv',
    'LocalStorageModule'
  ])
  .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', 'localStorageServiceProvider', function($stateProvider, $urlRouterProvider, $locationProvider, localStorageServiceProvider) {
    //
    // Set up local storage
    localStorageServiceProvider
      .setPrefix('itapapersApp')
      .setStorageCookie(1, '/')
      .setStorageType('sessionStorage')
      .setNotify(true, true);

    //
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/");
    //
    // Now set up the states
    $stateProvider
      .state('main', {
        url: "/?debug",
        templateUrl: "views/main.html",
        controller: "MainCtrl"
      })
      .state('author', {
        url: "/author/:authorId?debug",
        templateUrl: "views/author.html",
        controller: "AuthorCtrl"
      })
      .state('paper', {
        url: "/paper/:paperId?debug",
        templateUrl: "views/paper.html",
        controller: "PaperCtrl"
      })
      .state('venue', {
        url: "/venue/:venueId/:year?debug",
        templateUrl: "views/venue.html",
        controller: "VenueCtrl"
      })
      .state('organisation', {
        url: "/organisation/:organisationId?debug",
        templateUrl: "views/organisation.html",
        controller: "OrganisationCtrl"
      })
      .state('topic', {
        url: "/topic/:topicId?debug",
        templateUrl: "views/topic.html",
        controller: "TopicCtrl"
      })
      .state('project', {
        url: "/project/:projectId?debug",
        templateUrl: "views/project.html",
        controller: "ProjectCtrl"
      })
      .state('collaboration', {
        url: "/collaboration?author&debug",
        templateUrl: "views/collaboration.html",
        controller: "CollaborationCtrl"
      })
      .state('results', {
        url: "/results?debug",
        templateUrl: "views/results.html",
        controller: "ResultsCtrl"
      })
      .state('statistics', {
        url: "/statistics",
        templateUrl: "views/statistics.html",
        controller: "StatisticsCtrl"
      })
      .state('comments', {
        url: "/comments?debug",
        templateUrl: "views/comments.html",
        controller: "CommentsCtrl"
      })
      .state('compute', {
        url: "/compute?debug",
        templateUrl: "views/compute.html",
        controller: "ComputeCtrl"
      });

      // use the HTML5 History API
      $locationProvider.html5Mode(true);
    }]);
