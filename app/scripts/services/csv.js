/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('scienceLibrary')

.factory('csv', function () {
  'use strict';

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
