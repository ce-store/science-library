'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.charts
 * @description
 * # charts
 * Service in the itapapersApp.
 */
angular.module('itapapersApp')
  .service('charts', ['utils', 'definitions', function (utils, ce) {
    var getScatterData = function(results, server) {
      var data = results.data;
      var instances = results.instances;

      var useStorage = typeof(Storage) !== "undefined";
      var citationData = [];
      var hIndexData = [];
      var googleCitationData = [];
      var googleHIndexData = [];
      var scatterOptions;

      if (useStorage && localStorage.getItem("scatterOptions")) {
        scatterOptions = JSON.parse(localStorage.getItem("scatterOptions"));
      } else {
        for (var i = 0; i < data.length; ++i) {
          var personProps = instances[data[i][0]].property_values;
          var citationProps = instances[data[i][1]].property_values;
          var orgProps = instances[data[i][2]].property_values;

          var id = data[i][0];

          // person properties
          var citations = utils.getIntProperty(personProps, ce.author.localCitationCount);
          var hIndex = utils.getIntProperty(personProps, ce.author.localHIndex);
          var googleCitation = utils.getProperty(personProps, ce.author.googleCitationCount);
          var totalPubs = utils.getIntProperty(personProps, ce.author.externalDocumentCount);
          var profilePicture = utils.getProperty(personProps, ce.author.profilePicture);

          // citation properties
          var googleCitations = utils.getIntProperty(citationProps, ce.citation.count);
          var googleHIndex = utils.getIntProperty(citationProps, ce.citation.hIndex);

          // organisation properties
          var industry = utils.getUnknownProperty(orgProps, ce.organisation.type);

          var c = {
            id: id,
            employer:   data[i][2],
            name:       data[i][3],
            totalPubs:  totalPubs,
            citations:  citations,
            hIndex:     hIndex,
            picture:    profilePicture,
            googleCitations:  googleCitations,
            googleHIndex:     googleHIndex,
            industry:   industry,
            yValue:     citations,
          };
          var h = {
            id: id,
            employer:   data[i][2],
            name:       data[i][3],
            totalPubs:  totalPubs,
            citations:  citations,
            hIndex:     hIndex,
            picture:    profilePicture,
            googleCitations:  googleCitations,
            googleHIndex:     googleHIndex,
            industry:   industry,
            yValue:     hIndex
          };
          var gc = {
            id: id,
            employer:   data[i][2],
            name:       data[i][3],
            totalPubs:  totalPubs,
            citations:  citations,
            hIndex:     hIndex,
            picture:    profilePicture,
            googleCitations:  googleCitations,
            googleHIndex:     googleHIndex,
            industry:   industry,
            yValue:     googleCitations
          };
          var gh = {
            id: id,
            employer:   data[i][2],
            name:       data[i][3],
            totalPubs:  totalPubs,
            citations:  citations,
            hIndex:     hIndex,
            picture:    profilePicture,
            googleCitations:  googleCitations,
            googleHIndex:     googleHIndex,
            industry:   industry,
            yValue:     googleHIndex
          };

          citationData.push(c);
          hIndexData.push(h);
          googleCitationData.push(gc);
          googleHIndexData.push(gh);
        }

        scatterOptions = {
          citations:        citationData,
          hIndex:           hIndexData,
          googleCitations:  googleCitationData,
          googleHIndex:     googleHIndexData
        };
        localStorage.setItem("scatterOptions", JSON.stringify(scatterOptions));
      }

      return scatterOptions;
    };

    var getSunburstData = function (data) {
      var children = {
        "IND":      [],
        "AC":       [],
        "GOV":      [],
        "Unknown":  []
      };

      for (var i = 0; i < data.results.length; ++i) {
        var id = data.results[i][0];
        var orgProps = data.instances[id].property_values;

        // organisation properties
        var name = utils.getProperty(orgProps, ce.organisation.name);
        var type = utils.getUnknownProperty(orgProps, ce.organisation.type);
        var employeeList = utils.getListProperty(orgProps, ce.organisation.employeeList);
        var documentCount = utils.getIntProperty(orgProps, ce.organisation.documentCount);

        if (!employeeList.length) {
          employeeList = [];
        }

        children[type].push({
          name:       name,
          employees:  employeeList.length,
          papers:     documentCount
        });
      }

      var sunburstData = {
        name: "flare",
        children: [{
          name: "AC",
          children: children.AC
        }, {
          name: "IND",
          children: children.IND
        }, {
          name: "GOV",
          children: children.GOV
        }]
      };

      return sunburstData;
    };

    return {
      getScatterData: getScatterData,
      getSunburstData: getSunburstData
    };
  }]);
