'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.utils
 * @description
 * # requests
 * Factory in the itapapersApp.
 */
angular.module('itapapersApp')
  .factory('requests', ['urls', 'definitions', function (urls, ce) {
    var target = urls.server + urls.ceStore;

    return {
      lastUpdated: function () {
        var url = null;
        var queryName = ce.queries.lastUpdated;

        url = target + "/queries/" + queryName + "/execute";
        url += "?showStats=false";

        return url;
      },
      statistics: function () {
        var url = null;

        url = target + "/concepts/" + ce.concepts.total + "/instances";
        url += "?showStats=false";
        url += "&style=minimal";

        return url;
      },
      listTopics: function() {
        var url = null;

        url = target + "/concepts/" + ce.concepts.topic + "/instances";
        url += "?showStats=false";
        url += "&style=minimal";

        return url;
      },
      listOrganisations: function() {
        var url = null;

        url = target + "/concepts/" + ce.concepts.coreOrganisation + "/instances";
        url += "?showStats=false";
        url += "&style=minimal";

        return url;
      },
      listProjects: function() {
        var url = null;

        url = target + "/concepts/" + ce.concepts.project + "/instances";
        url += "?showStats=false";
        url += "&style=minimal";

        return url;
      },
      listDocuments: function() {
        var url = null;
        var onlyProps = null;

        onlyProps = ce.paper.title + ",";
        onlyProps += ce.paper.finalDate + ",";
        onlyProps += ce.paper.citationCount + ",";
        onlyProps += ce.paper.status + ",";
        onlyProps += ce.paper.programme + ",";
        onlyProps += ce.paper.weight + ",";
        onlyProps += ce.paper.noteworthyReason + ",";
        onlyProps += ce.paper.variantList;

        url = target + "/concepts/" + ce.concepts.document + "/instances";
        url += "?showStats=false";
        url += "&style=minimal";
        url += "&onlyProperties=" + onlyProps;

        return url;
      },
      listCorePeople: function() {
        var url = null;
        var onlyProps = null;

        onlyProps = ce.author.fullName + ",";
        onlyProps += ce.author.profilePicture + ",";
        onlyProps += ce.author.writesFor + ",";
        onlyProps += ce.author.localCitationCount + ",";
        onlyProps += ce.author.localHIndex + ",";
        onlyProps += ce.author.overallCitationCount + ",";
        onlyProps += ce.author.overallHIndex + ",";
        onlyProps += ce.author.documentCount + ",";
        onlyProps += ce.author.externalDocumentCount + ",";
        onlyProps += ce.author.coAuthorCount;

        url = target + "/concepts/" + ce.concepts.corePerson + "/instances";
        url += "?showStats=false";
        url += "&style=minimal";
        url += "&onlyProperties=" + onlyProps;

        return url;
      },
      listEventSeries: function() {
        var url = null;

        url = target + "/concepts/" + ce.concepts.eventSeries + "/instances";
        url += "?showStats=false";
        url += "&style=minimal";

        return url;
      },
      authorMainDetails: function (authorId) {
        var url = null;
        var limRels = null;
        var onlyProps = null;

        limRels = ce.author.writesFor + ",";
        limRels += ce.author.writesAbout + ",";
        limRels += ce.author.coAuthorList;

        onlyProps = ce.author.fullName + ",";
        onlyProps += ce.author.documentCount + ",";
        onlyProps += ce.author.externalDocumentCount + ",";
        onlyProps += ce.author.internalDocumentCount + ",";
        onlyProps += ce.author.journalCount + ",";
        onlyProps += ce.author.patentCount + ",";
        onlyProps += ce.author.externalConferencePaperCount + ",";
        onlyProps += ce.author.internalConferencePaperCount + ",";
        onlyProps += ce.author.technicalReportCount + ",";
        onlyProps += ce.author.otherCount + ",";
        onlyProps += ce.author.documentList + ",";
        onlyProps += ce.paper.title;

        url = target + "/instances/" + authorId;
        url += "?showStats=false";
        url += "&steps=1";
        url += "&style=minimal";
        url += "&referringInstances=false";
        url += "&limitRelationships=" + limRels;
        url += "&onlyProperties=" + onlyProps;

        return url;
      },
      authorPaperDetails: function (authorId) {
          var url = null;
          var limRels = null;
          var onlyProps = null;

          limRels = ce.author.documentList + ",";
          limRels += ce.paper.finalDate + ",";
          limRels += ce.paper.variantList + ",";
          limRels += ce.paper.authorList;

          onlyProps = ce.author.fullName + ",";
          onlyProps += ce.paper.title + ",";
          onlyProps += ce.date.month + ",";
          onlyProps += ce.date.year + ",";
          onlyProps += ce.orderedAuthor.person;

          url = target + "/instances/" + authorId;
          url += "?showStats=false";
          url += "&steps=2";
          url += "&style=minimal";
          url += "&referringInstances=false";
          url += "&limitRelationships=" + limRels;
          url += "&onlyProperties=" + onlyProps;

          return url;
        },
      authorCoAuthorDetails: function (authorId) {
        var url = null;
        var limRels = null;
        var onlyProps = null;

        limRels = ce.author.coAuthorStatistic + ",";
        limRels += ce.statistic.coAuthorList;

        onlyProps = ce.statistic.coAuthorCount  + ",";
        onlyProps += ce.author.fullName;

        url = target + "/instances/" + authorId;
        url += "?showStats=false";
        url += "&steps=2";
        url += "&style=minimal";
        url += "&referringInstances=false";
        url += "&limitRelationships=" + limRels;
        url += "&onlyProperties=" + onlyProps;

        return url;
      },
      documentDetails: function(docId) {
        var url = null;

        url = target + "/instances/" + docId;
        url += "?showStats=false";
        url += "&steps=2";
        url += "&style=minimal";
        url += "&referringInstances=false";

        return url;
      },
      venueDetails: function(venueId) {
        var url = null;

        url = target + "/instances/" + venueId;
        url += "?showStats=false";
        url += "&style=minimal";

        return url;
      },
      organisationDetails: function(orgId) {
        var url = null;
        var limRels = null;

        limRels = ce.organisation.location + ",";
        limRels += ce.organisation.employeeList + ",";
        limRels += ce.organisation.citationCount + ",";
        limRels += ce.organisation.documentList + ",";
        limRels += ce.paper.finalDate;

        url = target + "/instances/" + orgId;
        url += "?showStats=false";
        url += "&style=minimal";
        url += "&steps=3";
        url += "&referringInstances=false";
        url += "&limitRelationships=" + limRels;

        return url;
      },
      topicDetails: function(topicId) {
        var url = null;
        var limRels = null;

        limRels = ce.topic.topicStatistic + ",";
        limRels += ce.topic.citationCount + ",";
        limRels += ce.statistic.person + ",";
        limRels += ce.statistic.documentList + ",";
        limRels += ce.statistic.organisation;

        url = target + "/instances/" + topicId;
        url += "?showStats=false";
        url += "&style=minimal";
        url += "&steps=3";
        url += "&referringInstances=false";
        url += "&limitRelationships=" + limRels;

        return url;
      },
      projectDetails: function(projectId) {
          var url = null;
          var limRels = null;

          limRels = ce.project.paper + ",";
          limRels += ce.project.technicalArea;

          url = target + "/instances/" + projectId;
          url += "?showStats=false";
          url += "&style=minimal";
          url += "&steps=2";
          url += "&referringInstances=false";
          url += "&limitRelationships=" + limRels;

          return url;
      },
      eventSeriesDetails: function(esId) {
          var url = null;
          var limRels = null;
          var onlyProps = null;

          limRels = ce.series.eventList + ",";
          limRels += ce.venue.location + ",";
          limRels += ce.venue.documentList + ",";
          limRels += ce.paper.authorList + ",";
          limRels += ce.orderedAuthor.person  + ",";
          limRels += ce.orderedAuthor.organisation  + ",";
          limRels += ce.organisation.location;

          onlyProps = ce.author.fullName + ",";
          onlyProps += ce.location.lat + ",";
          onlyProps += ce.location.lon + ",";
//          onlyProps += ce.series.name + ",";	//same as ce.author.fullName
          onlyProps += ce.series.years + ",";
//          onlyProps += ce.venue.name + ",";	//same as ce.author.fullName
          onlyProps += ce.venue.startDate + ",";
          onlyProps += ce.venue.endDate + ",";
          onlyProps += ce.venue.url + ",";
          onlyProps += ce.organisation.name + ",";
          onlyProps += ce.paper.title + ",";
          onlyProps += ce.paper.citationCount;

          url = target + "/instances/" + esId;
          url += "?showStats=false";
          url += "&style=minimal";
          url += "&steps=5";
          url += "&referringInstances=false";
          url += "&limitRelationships=" + limRels;
          url += "&onlyProperties=" + onlyProps;

          return url;
      },
      coAuthorQuery: function(queryName) {
          var url = null;

          url = target + "/queries/" + queryName + "/execute";
          url += "?showStats=false";
          url += "&suppressCe=true";

          return url;
      },
      computeDetails: function() {
        var url = null;
        var conNames = null;

        conNames = ce.concepts.publishedPerson + ",";
        conNames += ce.concepts.document + ",";
        conNames += ce.concepts.coAuthorStatistic + ",";
        conNames += ce.concepts.paperCitationCount + ",";
        conNames += ce.concepts.orderedAuthor + ",";
        conNames += ce.concepts.publishedOrganisation + ",";
        conNames += ce.concepts.topicPersonStatistic + ",";
        conNames += ce.concepts.topicOrganisationStatistic;

        url = target + "/special/instances-for-multiple-concepts";
        url += "?showStats=false";
        url += "&style=minimal";
        url += "&conceptNames=" + conNames;

        return url;
      }
    };
  }]);