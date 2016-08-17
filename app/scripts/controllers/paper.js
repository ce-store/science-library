'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:PaperCtrl
 * @description
 * # PaperCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('PaperCtrl', ['$scope', '$stateParams', '$http', 'store', 'hudson', 'urls', 'documentTypes', 'utils', 'csv', 'definitions', function ($scope, $stateParams, $http, store, hudson, urls, documentTypes, utils, csv, ce) {
    $scope.scienceLibrary = urls.scienceLibrary;
    $scope.journalType            = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType    = documentTypes.technical;
    $scope.otherDocumentType      = documentTypes.other;
    $scope.conferenceType         = documentTypes.conference;

    var lastHighlight = null;
    var types = documentTypes.nameMap;

    $scope.$on('question:added', function() {
      refreshHighlight();
    });

    $scope.show = function(element) {
      $scope.source = $scope[element + 'Source'];
    };

    var refreshHighlight = function() {
      var qa = hudson.getLatestQuestion();

      if (lastHighlight) {
        $scope[lastHighlight] = false;
      }

      if (qa && qa.type === 'highlight') {
        $scope[qa.property + 'Highlight'] = true;
        lastHighlight = qa.property + 'Highlight';
      }
    };

    // get window size
    $scope.width = window.innerWidth;
    $scope.height = window.innerHeight;

    // set max-height of publication list
    var paperImgElem = angular.element("#paper-img");
    var maxHeight = $scope.height - 190;
    paperImgElem.css("max-height", maxHeight + "px");

    // set max-height of publication list
    var paperAbstractElem = angular.element("#paper-abstract");
    maxHeight = $scope.height - 600;
    paperAbstractElem.css("max-height", maxHeight + "px");

    store.getPaper($stateParams.paperId)
      .then(function(data) {
        var i = 0;
//        var csvData = [];

        var conceptNames = data.main_instance.concept_names;
        var properties = data.main_instance.property_values;
        var relatedInstances = data.related_instances;

        // paper properties
        var title     = utils.getUnknownProperty(properties, ce.paper.title);
        var abstract  = utils.getUnknownProperty(properties, ce.paper.abstract);
        var status    = utils.getProperty(properties, ce.paper.status);
        var venue     = utils.getProperty(properties, ce.paper.venue);
        var finalDate = utils.getProperty(properties, ce.paper.finalDate);
        var project   = utils.getUnknownProperty(properties, ce.paper.project);
        var authorList  = utils.getListProperty(properties, ce.paper.authorList);
        var variantList = utils.getListProperty(properties, ce.paper.variantList);
        var noteworthy  = utils.getProperty(properties, ce.paper.noteworthyReason);
        var googleCitationCount = utils.getProperty(properties, ce.paper.googleCitationCount);
        var paperFile       = utils.getProperty(properties, ce.paper.paperFile);
        var paperThumbnail  = utils.getProperty(properties, ce.paper.paperThumbnail);
        var presentationFile = utils.getProperty(properties, ce.paper.presentationFile);
        var presentationThumbnail = utils.getProperty(properties, ce.paper.presentationThumbnail);
        var posterFile = utils.getProperty(properties, ce.paper.posterFile);
        var posterThumbnail = utils.getProperty(properties, ce.paper.posterThumbnail);

        $scope.title      = title;
        $scope.noteworthy = noteworthy;
        $scope.status     = status;
        $scope.paperSource        = paperThumbnail;
        $scope.presentationSource = presentationThumbnail;
        $scope.posterSource       = posterThumbnail;
        $scope.source = $scope.paperSource;
        $scope.paperType  = utils.getType(conceptNames);
        $scope.paperClass = utils.getClassName($scope.paperType);

        // Order authors
        $scope.orderedAuthors = [];
        if (authorList) {
          for (i = 0; i < authorList.length; ++i) {
            var orderedAuthorProps = relatedInstances[authorList[i]].property_values;

            // ordered author properties
            var orderedAuthorIndex = utils.getProperty(orderedAuthorProps, ce.orderedAuthor.index);
            var orderedAuthorPerson = utils.getProperty(orderedAuthorProps, ce.orderedAuthor.person);
            var orderedAuthorOrg = utils.getProperty(orderedAuthorProps, ce.orderedAuthor.organisation);

            var unknownIndex = 99;
            if (!orderedAuthorIndex) {
              orderedAuthorIndex = unknownIndex;
            }

            var authorProps = relatedInstances[orderedAuthorPerson].property_values;

            // author properties
            var authorName = utils.getUnknownProperty(authorProps, ce.author.fullName);

            $scope.orderedAuthors.push({
              index:  orderedAuthorIndex,
              id:     orderedAuthorPerson,
              name:   authorName
            });
          }
        }

        $scope.orderedAuthors.sort(function(a, b) {
          return a.index - b.index;
        });

        // citations
        $scope.scholarLink = "https://scholar.google.co.uk/scholar?q=%22" + title + "%22&btnG=&hl=en&as_sdt=0%2C5";

        if (googleCitationCount) {
          var citationProps = relatedInstances[googleCitationCount].property_values;

          // citation properties
          var citationUrl = utils.getProperty(citationProps, ce.citation.url);
          var citationCount = utils.getProperty(citationProps, ce.citation.count);

          $scope.citationCount = {
            url:    citationUrl,
            count:  citationCount
          };
        }

        // venue
        if (venue) {
          var event = relatedInstances[venue];
          var eventProps = event.property_values;

          // event properties
          var eventSeriesId = utils.getProperty(eventProps, ce.venue.eventSeries);
          var eventLocation = utils.getProperty(eventProps, ce.venue.location);
          var eventSeries = relatedInstances[eventSeriesId];

          $scope.venue = {
            id:   eventSeries._id,
            year: event._id,
            name: event._id
          };

          // Get venue data
          store.getVenue(eventLocation)
            .then(function(data) {
              var locationProps = data.property_values;

              // venue properties
              var lon = utils.getProperty(locationProps, ce.location.lon);
              var lat = utils.getProperty(locationProps, ce.location.lat);

              var center = {
                latitude:   lat,
                longitude:  lon
              };

              $scope.map = {
                center: center,
                zoom:   8
              };
              $scope.marker = {
                id:  data._id,
                coords: center
              };
            });
        }

        if ($scope.paperType === types[$scope.otherDocumentType]) {
          // set type to specific type of other document
          for (var j = 0; j < conceptNames.length; ++j) {
            if (conceptNames.indexOf(documentTypes.invitedTalk) > -1) {
              $scope.paperType = types[documentTypes.invitedTalk];
            } else if (conceptNames.indexOf(documentTypes.bookChapter) > -1) {
              $scope.paperType = types[documentTypes.bookChapter];
            } else if (conceptNames.indexOf(documentTypes.phdThesis) > -1) {
              $scope.paperType = types[documentTypes.phdThesis];
            } else if (conceptNames.indexOf(documentTypes.poster) > -1) {
              $scope.paperType = types[documentTypes.poster];
            } else if (conceptNames.indexOf(documentTypes.workshop) > -1) {
              $scope.paperType = types[documentTypes.workshop];
            } else if (conceptNames.indexOf(documentTypes.softwareAsset) > -1) {
              $scope.paperType = types[documentTypes.softwareAsset];
            } else if (conceptNames.indexOf(documentTypes.demonstration) > -1) {
              $scope.paperType = types[documentTypes.demonstration];
            }
          }
        }

        // final date
        if (finalDate) {
          var dateProps = relatedInstances[finalDate].property_values;

          // date properties
          var dateDay     = utils.getProperty(dateProps, ce.date.day);
          var dateMonth   = utils.getProperty(dateProps, ce.date.month);
          var dateYear    = utils.getProperty(dateProps, ce.date.year);

          var date;

          if (dateDay) {
            date = new Date(dateYear, dateMonth - 1, dateDay);
          } else {
            date = new Date(dateYear, dateMonth - 1);
          }

          $scope.published = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
          $scope.year = dateYear;
        }

        // project
        if (project && relatedInstances[project]) {
          var projectProps = relatedInstances[project].property_values;

          // project properties
          var projectName = utils.getUnknownProperty(projectProps, ce.project.name);

          $scope.project = {
            id:   project,
            name: projectName
          };
        }

        // abstract
        if (abstract) {
          $scope.abstract = abstract;
        }

        // variants
        $scope.variants = [];
        if (variantList) {
          for (var k = 0; k < variantList.length; ++k) {
            var variantId = variantList[k];
            var type = utils.getType(relatedInstances[variantId].concept_names);
            var variantProps = relatedInstances[variantId].property_values;

            // variant properties
            var variantName = utils.getUnknownProperty(variantProps, ce.paper.title);

            var variant = {
              id:   variantId,
              name: variantName,
              className: utils.getClassName(type)
            };

            $scope.variants.push(variant);
          }
        }

        // download links
        if (paperFile) {
          $scope.paperDownloadUrl = urls.server + paperFile;
        }
        if (posterFile) {
          $scope.posterDownloadUrl = urls.server + posterFile;
        }
        if (presentationFile) {
          $scope.presentationDownloadUrl = urls.server + presentationFile;
        }

        for (var oa in $scope.orderedAuthors) {
          if ($scope.orderedAuthors.hasOwnProperty(oa)) {
            var a         = $scope.orderedAuthors[oa];
            var projId    = $scope.project ? $scope.project.id : "";
            var projName  = $scope.project ? $scope.project.name : "";
            var cUrl      = $scope.citationCount ? $scope.citationCount.url : "";
            var cCount    = $scope.citationCount ? $scope.citationCount.count : "";
            var vId       = $scope.venue ? $scope.venue.id : $scope["old venue"];
            var vYear     = $scope.venue ? $scope.venue.year : "";
            var vName     = $scope.venue ? $scope.venue.name : "";

//            csvData.push([$stateParams.paperId, $scope.title, $scope.published, a.id, a.name, projId, projName, cUrl, cCount, $scope.paperType, vId, vYear, vName]);
          }
        }

//        csv.setData(csvData);
//        csv.setHeader(["id", "title", "publish date", "author id", "author name", "project id", "project name", "citation url", "citation count", "paper type", "venue id", "venue year", "venue name"]);
//        csv.setName($stateParams.paperId);

        refreshHighlight();
    });
  }]);
