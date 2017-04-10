/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('itapapersApp')

.factory('store', ['$http', '$q', 'localStorageService', 'utils', 'requests', 'definitions', function ($http, $q, localStorageService, utils, reqs, ce) {
  'use strict';

  function getDocuments () {
    var url = reqs.listDocuments();

    return makeRequest(url, ce.concepts.document);
  }

  function getPublishedPeople () {
    var url = reqs.listCorePeople();

    return makeRequest(url, ce.concepts.corePerson);
  }

  function getEventSeries () {
    var url = reqs.listEventSeries();

    return makeRequest(url, ce.concepts.eventSeries);
  }

  function getProjects () {
    var url = reqs.listProjects();

    return makeRequest(url, ce.concepts.project);
  }

  function getOrganisations () {
    var url = reqs.listOrganisations();

    return makeRequest(url, ce.concepts.organisation);
  }

  function getTopics() {
    var url = reqs.listTopics();

    return makeRequest(url, ce.concepts.topic);
  }

  function getAuthorMain (authorName) {
    var url = reqs.authorMainDetails(authorName);

    return makeRequest(url, authorName + ' (main)');
  }

  function getAuthorPapers (authorName) {
    var url = reqs.authorPaperDetails(authorName);

    return makeRequest(url, authorName + ' (papers)');
  }

  function getAuthorCoAuthors (authorName) {
    var url = reqs.authorCoAuthorDetails(authorName);

    return makeRequest(url, authorName + ' (co-authors)');
  }

  function getPaper (paperName) {
    var url = reqs.documentDetails(paperName);

    return makeRequest(url, paperName);
  }

  function getVenue (location) {
    var url = reqs.venueDetails(location);

    return makeRequest(url, location);
  }

  function getOrganisation (organisation) {
    var url = reqs.organisationDetails(organisation);

    return makeRequest(url, organisation);
  }

  function getTopic (topic) {
    var url = reqs.topicDetails(topic);

    return makeRequest(url, topic);
  }

  function runCoAuthorQuery (queryName) {
    var url = reqs.coAuthorQuery(queryName);

    return makeRequest(url, queryName);
  }

  function getProject (project) {
    var url = reqs.projectDetails(project);

    return makeRequest(url, project);
  }

  function getStatistics () {
    var url = reqs.statistics();

    return makeRequest(url, ce.concepts.total);
  }

  function getEventSeriesDetails (esId) {
    var url = reqs.eventSeriesDetails(esId);

    return makeRequest(url, esId);
  }

  function getLastUpdated () {
    var url = reqs.lastUpdated();

    return makeRequest(url, ce.queries.lastUpdated);
  }

  function getDataForCompute () {
    var url = reqs.computeDetails();

    return makeRequest(url, 'compute');
  }

  function makeRequest(url, key) {
    var fullKey = key;

    if (localStorageService.isSupported) {
      var val = localStorageService.get(fullKey);

      if (val) {
        return $q.when(val);
      } else {
        return $http.post('ce/query', { url: url })
          .then(function(response) {
            localStorageService.set(fullKey, response.data);
            return $q.when(response.data);
          }, function(err) {
            return err;
          });
      }
    }
  }

  function getVoiceAcceptance () {
    var key = 'voice';

    if (localStorageService.isSupported) {
      var val = localStorageService.get(key);

      return $q.when(val);
    } else {
      return $q.when(false);
    }
  }

  function setVoiceAcceptance (accepted) {
    var key = 'voice';

    if (localStorageService.isSupported) {
      localStorageService.set(key, accepted);
    }
  }

  return {
    getDataForCompute: getDataForCompute,
    getDocuments: getDocuments,
    getPublishedPeople: getPublishedPeople,
    getEventSeries: getEventSeries,
    getProjects: getProjects,
    getOrganisations: getOrganisations,
    getTopics: getTopics,
    getAuthorMain: getAuthorMain,
    getAuthorPapers: getAuthorPapers,
    getAuthorCoAuthors: getAuthorCoAuthors,
    getPaper: getPaper,
    getVenue: getVenue,
    getOrganisation: getOrganisation,
    getTopic: getTopic,
    runCoAuthorQuery: runCoAuthorQuery,
    getProject: getProject,
    getEventSeriesDetails: getEventSeriesDetails,
    getVoiceAcceptance: getVoiceAcceptance,
    setVoiceAcceptance: setVoiceAcceptance,
    getStatistics: getStatistics,
    getLastUpdated: getLastUpdated
  };
}]);
