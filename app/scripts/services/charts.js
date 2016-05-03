'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.charts
 * @description
 * # charts
 * Service in the itapapersApp.
 */
angular.module('itapapersApp')
  .service('charts', function () {
    var getScatterData = function(results, server) {
      var data = results.data;
      var instances = results.instances;

      var useStorage = typeof(Storage) !== "undefined";
      var citationData = [];
      var hIndexData = [];
      var scatterOptions;

      if (useStorage && localStorage.getItem("scatterOptions")) {
        scatterOptions = JSON.parse(localStorage.getItem("scatterOptions"));
      } else {
        for (var i = 0; i < data.length; ++i) {
          var personProps = instances[data[i][0]].property_values;
          var citationProps = instances[data[i][1]].property_values;
          var orgProps = instances[data[i][2]].property_values;

          var id = data[i][0];
          var citations = personProps["local citation count"] ? personProps["local citation count"][0] : 0;
          var hIndex = personProps["local h-index"] ? personProps["local h-index"][0] : 0;
          var industry = orgProps.type ? orgProps.type[0] : "Unknown";

          var journals = personProps["journal paper count"] ? parseInt(personProps["journal paper count"][0], 10) : 0;
          var conferences = personProps["conference paper count"] ? parseInt(personProps["conference paper count"][0], 10) : 0;
          var totalPubs = journals + conferences;

          var c = {
            id: id,
            employer: data[i][2],
            name: data[i][3],
            totalPubs: totalPubs,
            citations: citations,
            hIndex: hIndex,
            industry: industry,
            yValue: citations
          };
          var h = {
            id: id,
            employer: data[i][2],
            name: data[i][3],
            totalPubs: totalPubs,
            citations: citations,
            hIndex: hIndex,
            industry: industry,
            yValue: hIndex
          };

          var profilePicture = results.instances[id].property_values["profile picture"];
          if (profilePicture) {
            profilePicture[0] = server + profilePicture[0];
            c.picture = profilePicture[0];
            h.picture = profilePicture[0];
          }

          citationData.push(c);
          hIndexData.push(h);
        }

        scatterOptions = {
          citations: citationData,
          hIndex: hIndexData
        };
        localStorage.setItem("scatterOptions", JSON.stringify(scatterOptions));
      }

      return scatterOptions;
    };

    var getSunburstData = function (data) {
      var children = {
        "IND": [],
        "AC": [],
        "GOV": [],
        "Unknown": []
      };

      for (var i = 0; i < data.results.length; ++i) {
        var id = data.results[i][0];
        var orgProps = data.instances[id].property_values;

        var name = orgProps.name ? orgProps.name[0] : id;
        var type = orgProps.type ? orgProps.type[0] : "Unknown";
        var employees = orgProps.employs ? orgProps.employs.length : 0;
        var papers = orgProps["paper count"] ? orgProps["paper count"] : 0;

        children[type].push({
          name: name,
          employees: employees,
          papers: papers
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
  });
