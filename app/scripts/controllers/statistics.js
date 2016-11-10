angular.module('itapapersApp')

.controller('StatisticsCtrl', ['$scope', 'store', 'utils', 'definitions', function ($scope, store, utils, ce) {
  'use strict';

  store.getStatistics()
    .then(function(data) {
      populateStatistics(data);
    });

  var populateStatistics = function(data) {
    $scope.statistics = [];

    for (var total in data) {
      if (data.hasOwnProperty(total)) {
        var properties = data[total].property_values;

        // total properties
        var scope = utils.getProperty(properties, ce.total.scope);
        var documentCount = utils.getIntProperty(properties, ce.total.documentCount);
        var singleInstituteCount = utils.getIntProperty(properties, ce.total.singleInstituteCount);
        var collaborativeCount = utils.getIntProperty(properties, ce.total.collaborativeCount);
        var internationalCount = utils.getIntProperty(properties, ce.total.internationalCount);
        var governmentCount = utils.getIntProperty(properties, ce.total.governmentCount);
        var journalCount = utils.getIntProperty(properties, ce.total.journalCount);
        var externalConferencePaperCount = utils.getIntProperty(properties, ce.total.externalConferencePaperCount);
        var patentCount = utils.getIntProperty(properties, ce.total.patentCount);
        var activeItaAuthors = utils.getIntProperty(properties, ce.total.activeItaAuthors);
        var activeNonItaAuthors = utils.getIntProperty(properties, ce.total.activeNonItaAuthors);
        var citationCount = utils.getIntProperty(properties, ce.total.citationCount);

        var row = {
          scope: parseInt(scope, 10) ? parseInt(scope, 10) : scope,
          totalPubs:          documentCount,
          singleInstCount:    singleInstituteCount,
          collabCount:        collaborativeCount,
          internationalCount: internationalCount,
          govCount:     governmentCount,
          journalCount: journalCount,
          extCount:     externalConferencePaperCount,
          patentCount:  patentCount,
          activeITA:    activeItaAuthors,
          activeNonITA: activeNonItaAuthors,
          citations:    citationCount
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
    }
  };
}]);
