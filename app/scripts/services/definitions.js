'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.definitions
 * @description
 * # definitions
 * Service in the itapapersApp.
 */
angular.module('itapapersApp')
  .service('definitions', function () {
    return {
      paper: {
        title:    'title',
        abstract: 'abstract',
        status:   'status',
        weight:   'weight',
        topic:    'is on',
        project:  'project',
        variantList:      'variant',
        noteworthyReason: 'noteworthy reason',
        finalDate:        'final date',
        publishDate:      'publish date',
        publicationYear:  'publication year',
        fullAuthorString: 'full author list',
        authorList:       'author',
        venue:        'venue',
        venueDetails: 'venue details',
        authorCount:  'number of authors',
        paperFile:              'paper file',
        paperThumbnail:         'paper thumbnail',
        posterFile:             'poster file',
        posterThumbnail:        'poster thumbnail',
        presentationFile:       'presentation file',
        presentationThumbnail:  'presentation thumbnail',
        googleCitationCount:    'citation count',
        citationCount:          'number of citations'
      },
      author: {
        forename:       'forename',
        surname:        'surname',
        fullName:       'full name',
        organisation:   'default organisation',
        profilePicture: 'profile picture',
        coAuthorList:   'co-author',
        documentList:   'wrote',
        documentCount:  'document count',
        externalDocumentCount:  'external document count',
        internalDocumentCount:  'internal document count',
        journalCount:   'journal paper count',
        patentCount:    'patent count',
        conferencePaperCount:         'conference paper count',
        exteralConferencePaperCount:  'external conference paper count',
        internalConferencePaperCount: 'internal conference paper count',
        technicalReportCount:         'technical report count',
        otherCount:                   'other document count',
        coAuthorCount:            'co-author count',
        governmentCoAuthorCount:  'government co-author count',
        googleCitationCount:      'citation count',
        localCitationCount:       'local citation count',
        localHIndex:              'local h-index',
        writesFor:      'writes documents for',
        writesAbout:    'writes about',
        coAuthorStatistic:    'co-author statistic',
        topicPersonStatistic:  'topic-person statistic',
      },
      organisation: {
        name:       'name',
        shortName:  'short name',
        location:   'is located at',
        type:       'type',
        affiliation:    'is affiliated to',
        employeeList:   'employs',
        documentList:   'wrote',
        citationCount:  'citation count',
        documentCount:          'document count',
        externalDocumentCount:  'external document count',
        internalDocumentCount:  'internal document count',
        journalCount:           'journal paper count',
        patentCount:            'patent count',
        conferencePaperCount:         'conference paper count',
        exteralConferencePaperCount:  'external conference paper count',
        internalConferencePaperCount: 'internal conference paper count',
        technicalReportCount:         'technical report count',
        otherCount:                   'other document count',
        topicOrganisationStatistic: 'topic-organisation statistic',
      },
      venue: {
        name:       'full name',
        startDate:  'start date',
        endDate:    'end date',
        date:       'corresponds to',
        location:   'occurs at',
        url:        'url',
        eventSeries:   'is part of',
        documentCount: 'paper count',
        citationCount: 'citation count'
      },
      project: {
        name: 'name'
      },
      topic: {
        marker:         'marker',
        topicStatistic: 'topic statistic',
        documentCount:  'number of documents',
        authorCount:    'number of authors',
        citationCount:  'citation count'
      },
      citation: {
        url:    'url',
        count:  'citation count',
        hIndex: 'h-index',
        date:   'date checked'
      },
      statistic: {
        mainAuthor:     'main-author',
        coAuthorList:   'co-author',
        coAuthorCount:  'co-author count'
      },
      orderedAuthor: {
        index:  'author index',
        person: 'author person',
        organisation: 'author organisation'
      },
      location: {
        lat: 'latitude',
        lon: 'longitude'
      },
      date: {
        string: 'original date string',
        day:    'day',
        month:  'month',
        year:   'year'
      }
    };
  });
