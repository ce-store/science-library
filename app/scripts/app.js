angular.module('itapapersApp', [
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
    .setPrefix('itapapersApp')
    .setStorageCookie(1, '/')
    .setStorageType('sessionStorage')
    .setNotify(true, true);

  $urlRouterProvider.otherwise("/");

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
      url: "/science-library",
      templateUrl: "views/science-library/main.html",
      controller: "MainCtrl"
    })
    .state('help', {
      url: "/science-library/help",
      templateUrl: "views/science-library/help.html",
      controller: "HelpCtrl"
    })
    .state('author', {
      url: "/science-library/author/:authorId?view",
      templateUrl: "views/science-library/author.html",
      controller: "AuthorCtrl"
    })
    .state('paper', {
      url: "/science-library/paper/:paperId",
      templateUrl: "views/science-library/paper.html",
      controller: "PaperCtrl"
    })
    .state('venue', {
      url: "/science-library/venue/:venueId/:year",
      templateUrl: "views/science-library/venue.html",
      controller: "VenueCtrl"
    })
    .state('organisation', {
      url: "/science-library/organisation/:organisationId?view",
      templateUrl: "views/science-library/organisation.html",
      controller: "OrganisationCtrl"
    })
    .state('topic', {
      url: "/science-library/topic/:topicId?view",
      templateUrl: "views/science-library/topic.html",
      controller: "TopicCtrl"
    })
    .state('project', {
      url: "/science-library/project/:projectId",
      templateUrl: "views/science-library/project.html",
      controller: "ProjectCtrl"
    })
    .state('collaboration', {
      url: "/science-library/collaboration?author",
      templateUrl: "views/science-library/collaboration.html",
      controller: "CollaborationCtrl"
    })
    .state('results', {
      url: "/science-library/results?keywords",
      templateUrl: "views/science-library/results.html",
      controller: "ResultsCtrl"
    })
    .state('statistics', {
      url: "/science-library/statistics",
      templateUrl: "views/science-library/statistics.html",
      controller: "StatisticsCtrl"
    })
    .state('compute', {
      url: "/science-library/compute",
      templateUrl: "views/science-library/compute.html",
      controller: "ComputeCtrl"
    })
    .state('special', {
      url: "/science-library/special",
      templateUrl: "views/science-library/special.html",
      controller: "SpecialCtrl"
    })
    .state('category', {
      url: "/science-library/:category",
      templateUrl: "views/science-library/main.html",
      controller: "MainCtrl"
    });

  $locationProvider.html5Mode(true);
}]);
