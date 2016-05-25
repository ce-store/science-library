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
      .state('home', {
        url: "/",
        templateUrl: "views/home.html",
        controller: "HomeCtrl"
      })
      .state('assets', {
        url: "/assets",
        templateUrl: "views/legacy/assets.html",
        controller: "AssetsCtrl"
      })
      .state('book', {
        url: "/book",
        templateUrl: "views/legacy/book.html",
        controller: "BookCtrl"
      })
      .state('capstone', {
        url: "/capstone",
        templateUrl: "views/legacy/capstone.html",
        controller: "CapstoneCtrl"
      })
      .state('cmc', {
        url: "/cmc",
        templateUrl: "views/legacy/cmc.html",
        controller: "CmcCtrl"
      })
      .state('experimentation', {
        url: "/experimentation",
        templateUrl: "views/legacy/experimentation.html",
        controller: "ExperimentationCtrl"
      })
      .state('peer-review', {
        url: "/peer-review",
        templateUrl: "views/legacy/peer-review.html",
        controller: "PeerReviewCtrl"
      })
      .state('plans', {
        url: "/plans",
        templateUrl: "views/legacy/plans.html",
        controller: "PlansCtrl"
      })
      .state('qprs', {
        url: "/qprs",
        templateUrl: "views/legacy/qprs.html",
        controller: "QprsCtrl"
      })
      .state('main', {
        url: "/ScienceLibrary",
        templateUrl: "views/science-library/main.html",
        controller: "MainCtrl"
      })
      .state('help', {
        url: "/ScienceLibrary/help",
        templateUrl: "views/science-library/help.html",
        controller: "HelpCtrl"
      })
      .state('author', {
        url: "/ScienceLibrary/author/:authorId",
        templateUrl: "views/science-library/author.html",
        controller: "AuthorCtrl"
      })
      .state('paper', {
        url: "/ScienceLibrary/paper/:paperId",
        templateUrl: "views/science-library/paper.html",
        controller: "PaperCtrl"
      })
      .state('venue', {
        url: "/ScienceLibrary/venue/:venueId/:year",
        templateUrl: "views/science-library/venue.html",
        controller: "VenueCtrl"
      })
      .state('organisation', {
        url: "/ScienceLibrary/organisation/:organisationId",
        templateUrl: "views/science-library/organisation.html",
        controller: "OrganisationCtrl"
      })
      .state('topic', {
        url: "/ScienceLibrary/topic/:topicId",
        templateUrl: "views/science-library/topic.html",
        controller: "TopicCtrl"
      })
      .state('project', {
        url: "/ScienceLibrary/project/:projectId",
        templateUrl: "views/science-library/project.html",
        controller: "ProjectCtrl"
      })
      .state('collaboration', {
        url: "/ScienceLibrary/collaboration?author",
        templateUrl: "views/science-library/collaboration.html",
        controller: "CollaborationCtrl"
      })
      .state('results', {
        url: "/ScienceLibrary/results?keywords",
        templateUrl: "views/science-library/results.html",
        controller: "ResultsCtrl"
      })
      .state('statistics', {
        url: "/ScienceLibrary/statistics",
        templateUrl: "views/science-library/statistics.html",
        controller: "StatisticsCtrl"
      })
      .state('compute', {
        url: "/compute",
        templateUrl: "views/science-library/compute.html",
        controller: "ComputeCtrl"
      })
      .state('category', {
        url: "/ScienceLibrary/:category",
        templateUrl: "views/science-library/main.html",
        controller: "MainCtrl"
      });

      // use the HTML5 History API
      $locationProvider.html5Mode(true);
    }]);
