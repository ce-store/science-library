'use strict';

/**
 * @ngdoc function
 * @name itapapersApp.controller:StatisticsCtrl
 * @description
 * # StatisticsCtrl
 * Controller of the itapapersApp
 */
angular.module('itapapersApp')
  .controller('StatisticsCtrl', ['$scope', 'store', function ($scope, store) {
    store.getStatistics()
      .then(function(data) {
        populateStatistics(data);
      });

    var populateStatistics = function(data) {
      $scope.statistics = [];

      for (var total in data.instances) {
        var vals = data.instances[total].property_values;

        var row = {
          scope: parseInt(vals.scope[0], 10) ? parseInt(vals.scope[0], 10) : vals.scope[0],
          totalPubs: parseInt(vals["total paper count"][0], 10),
          singleInstCount: parseInt(vals["single institute paper count"][0], 10),
          collabCount: parseInt(vals["collaborative paper count"][0], 10),
          internationalCount: parseInt(vals["international paper count"][0], 10),
          govCount: parseInt(vals["government paper count"][0], 10),
          journalCount: parseInt(vals["journal paper count"][0], 10),
          extCount: parseInt(vals["external conference paper count"][0], 10),
          patentCount: parseInt(vals["patent count"][0], 10),
          activeITA: parseInt(vals["active ITA authors"][0], 10),
          activeNonITA: parseInt(vals["active non-ITA authors"][0], 10),
          citations: parseInt(vals["total citations"][0], 10)
        };

        row.totalAuthors = row.activeITA + row.activeNonITA;

        row.singleInstCountPercent = Math.round(row.singleInstCount / row.totalPubs * 100);
        row.collabCountPercent = Math.round(row.collabCount / row.totalPubs * 100);
        row.internationalCountPercent = Math.round(row.internationalCount / row.totalPubs * 100);
        row.govCountPercent = Math.round(row.govCount / row.totalPubs * 100);
        row.journalCountPercent = Math.round(row.journalCount / row.totalPubs * 100);
        row.extCountPercent = Math.round(row.extCount / row.totalPubs * 100);
        row.patentCountPercent = Math.round(row.patentCount / row.totalPubs * 100);

        row.activeITAPercent = Math.round(row.activeITA / row.totalAuthors * 100);
        row.activeNonITAPercent = Math.round(row.activeNonITA / row.totalAuthors * 100);

        $scope.statistics.push(row);
      }
    };
  }]);
