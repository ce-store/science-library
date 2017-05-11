/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('itapapersApp')

.service('charts', ['utils', 'definitions', function (utils, ce) {
  'use strict';

  var getScatterData = function(results, server) {
    var data = results.results;
    var instances = results.instances;

    var useStorage = typeof(Storage) !== "undefined";
    var localCitationData = [];
    var localHIndexData = [];
    var overallCitationData = [];
    var overallHIndexData = [];
    var scatterOptions;

    for (var i = 0; i < data.length; ++i) {
      var person = instances[data[i][0]];
      var personProps = person.property_values;

      var id = person._id;

      // person properties
      var localCitations = utils.getIntProperty(personProps, ce.author.localCitationCount);
      var localHIndex = utils.getIntProperty(personProps, ce.author.localHIndex);
      var overallCitations = utils.getProperty(personProps, ce.author.overallCitationCount);
      var overallHIndex = utils.getIntProperty(personProps, ce.author.overallHIndex);
      var totalPubs = utils.getIntProperty(personProps, ce.author.externalDocumentCount);
      var profilePicture = utils.getProperty(personProps, ce.author.profilePicture);
      var fullName = utils.getProperty(personProps, ce.author.fullName);
      var writesFor = utils.getListProperty(personProps, ce.author.writesFor);
      var industry = utils.getIndustryFor(person);

      var lc = {
        id: id,
        employer:   writesFor,
        name:       fullName,
        totalPubs:  totalPubs,
        localCitations:  localCitations,
        localHIndex:     localHIndex,
        picture:    profilePicture,
        overallCitations:  overallCitations,
        overallHIndex:     overallHIndex,
        industry:   industry,
        yValue:     localCitations
      };
      var lh = {
        id: id,
        employer:   writesFor,
        name:       fullName,
        totalPubs:  totalPubs,
        localCitations:  localCitations,
        localHIndex:     localHIndex,
        picture:    profilePicture,
        overallCitations:  overallCitations,
        overallHIndex:     overallHIndex,
        industry:   industry,
        yValue:     localHIndex
      };
      var oc = {
        id: id,
        employer:   writesFor,
        name:       fullName,
        totalPubs:  totalPubs,
        localCitations:  localCitations,
        localHIndex:     localHIndex,
        picture:    profilePicture,
        overallCitations:  overallCitations,
        overallHIndex:     overallHIndex,
        industry:   industry,
        yValue:     overallCitations
      };
      var oh = {
        id: id,
        employer:   writesFor,
        name:       fullName,
        totalPubs:  totalPubs,
        localCitations:  localCitations,
        localHIndex:     localHIndex,
        picture:    profilePicture,
        overallCitations:  overallCitations,
        overallHIndex:     overallHIndex,
        industry:   industry,
        yValue:     overallHIndex
      };

      localCitationData.push(lc);
      localHIndexData.push(lh);
      overallCitationData.push(oc);
      overallHIndexData.push(oh);
    }

    scatterOptions = {
      localCitations:    localCitationData,
      localHIndex:       localHIndexData,
      overallCitations:  overallCitationData,
      overallHIndex:     overallHIndexData
    };

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
      var type = utils.getIndustryFor(data.instances[id]);
      var employeeList = utils.getListProperty(orgProps, ce.organisation.employeeList);
      var documentCount = utils.getIntProperty(orgProps, ce.organisation.documentCount);

      if (employeeList != null) {
        if (!employeeList.length) {
          employeeList = [];
        }
      }

      var empLen = null;

      if (employeeList) {
        empLen = employeeList.length;
      } else {
        empLen = 0;
      }

      children[type].push({
        name:       name,
        employees:  empLen,
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
