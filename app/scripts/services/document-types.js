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
    journal: "journal document",
    external: "external conference document",
    patent: "patent",
    internal: "internal conference document",
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
      "journal document": "Journal",
      "external conference document": "External Conference",
      "patent": "Patent",
      "internal conference document": "Internal Conference",
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
