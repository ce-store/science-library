'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.documentTypes
 * @description
 * # documentTypes
 * Constant in the itapapersApp.
 */
angular.module('itapapersApp')
  .constant('documentTypes', {
    journal: "journal paper",
    external: "external conference paper",
    patent: "patent",
    internal: "internal conference paper",
    technical: "technical report",
    other: "other document",
    invitedTalk: "invited talk",
    bookChapter: "book chapter",
    phdThesis: "phd thesis",
    poster: "poster",
    workshop: "workshop",
    softwareAsset: "software asset",
    demonstration: "demonstration",
    nameMap: {
      "journal paper": "Journal",
      "external conference paper": "External Conference",
      "patent": "Patent",
      "internal conference paper": "Internal Conference",
      "technical report": "Technical Report",
      "other document": "Other Document",
      "invited talk": "Invited Talk",
      "book chapter": "Book Chapter",
      "phd thesis": "PHD Thesis",
      "poster": "Poster",
      "workshop": "Workshop",
      "software asset": "Software Asset",
      "demonstration": "Demonstration"
    }
  });
