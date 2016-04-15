'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.csv
 * @description
 * # csv
 * Factory in the itapapersApp.
 */
angular.module('itapapersApp')
  .factory('csv', function () {
    var csvData = [];
    var csvHeader = "";
    var csvName = "test.csv";

    return {
      setData: function (data) {
        csvData = data;
      },
      getData: function () {
        return csvData;
      },
      setHeader: function(header) {
        csvHeader = header;
      },
      getHeader: function() {
        return csvHeader;
      },
      setName: function(name) {
        csvName = name + ".csv";
      },
      getName: function() {
        return csvName;
      }
    };
  });
