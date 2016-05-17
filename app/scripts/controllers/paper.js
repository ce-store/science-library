'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:PaperCtrl
 * @description
 * # PaperCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('PaperCtrl', ['$scope', '$stateParams', '$http', 'store', 'hudson', 'server', 'documentTypes', 'utils', 'csv', function ($scope, $stateParams, $http, store, hudson, server, documentTypes, utils, csv) {
    $scope.journalType = documentTypes.journal;
    $scope.externalConferenceType = documentTypes.external;
    $scope.internalConferenceType = documentTypes.internal;
    $scope.technicalReportType = documentTypes.technical;
    $scope.otherDocumentType = documentTypes.other;
    $scope.conferenceType = documentTypes.conference;
    $scope.accepted = 'accepted';

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
        var unknown = "Unknown";
        var csvData = [];

        var directConceptNames = data.main_instance.direct_concept_names;
        var properties = data.main_instance.property_values;
        var relatedInstances = data.related_instances;

        // Order authors
        $scope.orderedAuthors = [];
        if (properties.author) {
          for (i = 0; i < properties.author.length; ++i) {
            var author = relatedInstances[properties.author[i]].property_values;

            var id, name;
            if (author["author person"]) {
              id = author["author person"] ? author["author person"][0] : "";
              name = relatedInstances[author["author person"][0]].property_values["full name"][0];
            } else if (author["original author string"]) {
              id = "";
              name = author["original author string"][0];
            } else {
              id = "";
              name = properties.author[i];
            }

            var unknownIndex = 99;
            $scope.orderedAuthors.push({
              index: author["author index"] ? author["author index"][0] : unknownIndex,
              id: id,
              name: name
            });
          }
        }

        $scope.orderedAuthors.sort(function(a, b) {
          return a.index - b.index;
        });

        $scope.title = properties.title ? properties.title[0] : unknown;
        $scope.noteworthy = properties["noteworthy reason"] ? properties["noteworthy reason"][0] : null;
        $scope.status = properties.status ? properties.status[0] : unknown;

        // sources
        $scope.paperSource = properties["paper thumbnail"] ? server + properties["paper thumbnail"][0] : null;
        $scope.presentationSource = properties["presentation thumbnail"] ? server + properties["presentation thumbnail"][0] : null;
        $scope.posterSource = properties["poster thumbnail"] ? server + properties["poster thumbnail"][0] : null;

        $scope.source = $scope.paperSource;

        // citations
        $scope.scholarLink = "https://scholar.google.co.uk/scholar?q=%22" + properties.title[0] + "%22&btnG=&hl=en&as_sdt=0%2C5";

        if (properties["citation count"]) {
          var citationCount = relatedInstances[properties["citation count"][0]].property_values;
          if (citationCount.url && citationCount["citation count"]) {
            $scope.citationCount = {
              url: citationCount.url[0],
              count: citationCount["citation count"][0]
            };
          }
        }

        // paper type
        $scope.paperType = utils.getType(directConceptNames);
        $scope.paperClass = utils.getClassName($scope.paperType);

        // venue
        if (properties.venue) {
          var eventId = properties.venue;
          var event = relatedInstances[eventId];
          var eventSeriesId = event.property_values['is part of'][0];
          var eventSeries = relatedInstances[eventSeriesId];
          var venueYear = properties.venue[0];
          var venueArr = venueYear.split(" ");
          $scope.showVenue = true;
          $scope.venue = {
            id: eventSeries._id,
            year: event._id,
            name: event._id
          };

          // Get venue data
          var location = relatedInstances[venueYear].property_values["occurs at"];
          store.getVenue(location)
            .then(function(data) {
              var locationVals = data.property_values;
              var center = {
                latitude: locationVals.latitude[0],
                longitude: locationVals.longitude[0]
              };

              $scope.map = {
                center: center,
                zoom: 8
              };
              $scope.marker = {
                id: data._id,
                coords: center
              };
            });
        }

        if ($scope.paperType === types[$scope.otherDocumentType]) {
          // set type to specific type of other document
          for (var j = 0; j < directConceptNames.length; ++j) {
            if (directConceptNames.indexOf(documentTypes.invitedTalk) > -1) {
              $scope.paperType = types[documentTypes.invitedTalk];
            } else if (directConceptNames.indexOf(documentTypes.bookChapter) > -1) {
              $scope.paperType = types[documentTypes.bookChapter];
            } else if (directConceptNames.indexOf(documentTypes.phdThesis) > -1) {
              $scope.paperType = types[documentTypes.phdThesis];
            } else if (directConceptNames.indexOf(documentTypes.poster) > -1) {
              $scope.paperType = types[documentTypes.poster];
            } else if (directConceptNames.indexOf(documentTypes.workshop) > -1) {
              $scope.paperType = types[documentTypes.workshop];
            } else if (directConceptNames.indexOf(documentTypes.softwareAsset) > -1) {
              $scope.paperType = types[documentTypes.softwareAsset];
            } else if (directConceptNames.indexOf(documentTypes.demonstration) > -1) {
              $scope.paperType = types[documentTypes.demonstration];
            }
          }
        }

        // old venue
        if (properties["old venue"]) {
          $scope.oldVenue = properties["old venue"][0];
        }

        // publish date
        var dateVals = properties["final date"] ? relatedInstances[properties["final date"][0]].property_values : null;
        if (dateVals) {
          if (dateVals["original date string"]) {
            $scope.published = dateVals["original date string"][0];
          } else if (dateVals.month && dateVals.year) {
            var date;
            if (dateVals.day) {
              date = new Date(dateVals.year, dateVals.month - 1, dateVals.day);
            } else {
              date = new Date(dateVals.year, dateVals.month - 1);
            }
            $scope.published = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
          }
          $scope.year = dateVals.year[0];
        } else {
          $scope.published = unknown;
          $scope.year = unknown;
        }

        // project
        if (properties.project) {
          $scope.project = {
            id: properties.project[0],
            name: relatedInstances[properties.project[0]].property_values.name[0]
          };
        }

        // abstract
        if (properties.abstract) {
          $scope.abstract = properties.abstract[0];
        }

        // variants
        $scope.variants = [];
        if (properties.variant) {
          for (var j = 0; j < properties.variant.length; ++j) {
            var variantId = properties.variant[j];
            var type = utils.getType(relatedInstances[variantId].direct_concept_names);

            var variant = {
              id: variantId,
              name: relatedInstances[variantId].property_values.title[0],
              className: utils.getClassName(type)
            };

            $scope.variants.push(variant);
          }
        }

        // download links
        if (properties["paper file"]) {
          $scope.paperDownloadUrl = server + properties["paper file"][0];
        }
        if (properties["poster file"]) {
          $scope.posterDownloadUrl = server + properties["poster file"][0];
        }
        if (properties["presentation file"]) {
          $scope.presentationDownloadUrl = server + properties["presentation file"][0];
        }

        for (var oa in $scope.orderedAuthors) {
          var a = $scope.orderedAuthors[oa];
          var projId = $scope.project ? $scope.project.id : "";
          var projName = $scope.project ? $scope.project.name : "";
          var cUrl = $scope.citationCount ? $scope.citationCount.url : "";
          var cCount = $scope.citationCount ? $scope.citationCount.count : "";
          var vId = $scope.venue ? $scope.venue.id : $scope["old venue"];
          var vYear = $scope.venue ? $scope.venue.year : "";
          var vName = $scope.venue ? $scope.venue.name : "";

          csvData.push([$stateParams.paperId, $scope.title, $scope.published, a.id, a.name, projId, projName, cUrl, cCount, $scope.paperType, vId, vYear, vName]);
        }

        csv.setData(csvData);
        csv.setHeader(["id", "title", "publish date", "author id", "author name", "project id", "project name", "citation url", "citation count", "paper type", "venue id", "venue year", "venue name"]);
        csv.setName($stateParams.paperId);

        refreshHighlight();
    });

    var encodeForCe = function(pValue) {
      var result = null;

      if (pValue !== null) {
        result = pValue;
        result = result.replace(/\\/g, '\\\\');
        result = result.replace(new RegExp('\'', 'g'), '\\\'');
        result = result.replace(new RegExp('‘', 'g'), '\\‘');
        result = result.replace(new RegExp('’', 'g'), '\\’');
        result = result.replace(new RegExp('“', 'g'), '\\“');
        result = result.replace(new RegExp('”', 'g'), '\\”');
        result = result.replace(/(?:\r\n|\r|\n)/g, ' ');
      } else {
        result = '';
      }

      return result;
    };

    $scope.addAbstract = function() {
      var abstractText = prompt("Please enter the abstract", "some abstract text");
      if (abstractText !== null) {
      	  //DSB - switch request to open source ce-store
          var url = server + "/ce-store/stores/DEFAULT/sources/generalCeForm?showStats=true&action=save";
          var ce = "the document '" + $stateParams.paperId + "' has '" + encodeForCe(abstractText) + "' as abstract.";
          $scope.abstract = abstractText;
          console.log(ce);

          $.ajax({
            type: "POST",
            url: url,
            data: ce,
            contentType: "text/plain;charset=UTF-8"
          });
      }
    };

    $scope.addCitationCount = function() {
      var citationCount = prompt("Please enter the citation count", "42");
      if (citationCount !== null) {
      	//DSB - switch request to open source ce-store
        var url = server + "/ce-store/stores/DEFAULT/sources/generalCeForm?showStats=true&action=save";
        var date = new Date();
        var formattedDate = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

        var ce = "the paper citation count 'citation:" + $stateParams.paperId + "-01'" +
          "\n  has '" + $scope.scholarLink + "' as url and" +
          "\n  has '" + formattedDate + "' as date checked and" +
          "\n  has '" + citationCount + "' as citation count.";

        var paperCe = "\n\nthe document '" + $stateParams.paperId + "'" +
          "\n  has the paper citation count 'citation:" + $stateParams.paperId + "-01' as citation count.";

        $scope.citationCount = {
              url: $scope.scholarLink,
              count: citationCount
            };
        console.log(ce + paperCe);

        $.ajax({
          type: "POST",
          url: url,
          data: ce + " " + paperCe,
          contentType: "text/plain;charset=UTF-8"
        });
      }
    };
  }]);
