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
        url: "/",
        templateUrl: "views/main.html",
        controller: "MainCtrl"
      })
      .state('author', {
        url: "/author/:authorId",
        templateUrl: "views/author.html",
        controller: "AuthorCtrl"
      })
      .state('paper', {
        url: "/paper/:paperId",
        templateUrl: "views/paper.html",
        controller: "PaperCtrl"
      })
      .state('venue', {
        url: "/venue/:venueId/:year",
        templateUrl: "views/venue.html",
        controller: "VenueCtrl"
      })
      .state('organisation', {
        url: "/organisation/:organisationId",
        templateUrl: "views/organisation.html",
        controller: "OrganisationCtrl"
      })
      .state('topic', {
        url: "/topic/:topicId",
        templateUrl: "views/topic.html",
        controller: "TopicCtrl"
      })
      .state('project', {
        url: "/project/:projectId",
        templateUrl: "views/project.html",
        controller: "ProjectCtrl"
      })
      .state('collaboration', {
        url: "/collaboration?author",
        templateUrl: "views/collaboration.html",
        controller: "CollaborationCtrl"
      })
      .state('results', {
        url: "/results?keywords",
        templateUrl: "views/results.html",
        controller: "ResultsCtrl"
      })
      .state('statistics', {
        url: "/statistics",
        templateUrl: "views/statistics.html",
        controller: "StatisticsCtrl"
      })
      .state('compute', {
        url: "/compute",
        templateUrl: "views/compute.html",
        controller: "ComputeCtrl"
      })
      .state('category', {
        url: "/:category",
        templateUrl: "views/main.html",
        controller: "MainCtrl"
      });

      // use the HTML5 History API
      $locationProvider.html5Mode(true);
    }]);
