/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('scienceLibrary')

.constant('documentTypes', {
  journal: "journal paper",
  conference: "conference paper",
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
  },
  typeMap: {
    "Journal": "journal",
    "External Conference": "external",
    "Patent": "patent",
    "Internal Conference": "internal",
    "Technical Report": "technical",
    "Other Document": "other"
  }
});
