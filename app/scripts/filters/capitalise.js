'use strict';

/**
 * @ngdoc filter
 * @name itapapersApp.filter:capitalise
 * @function
 * @description
 * # capitalise
 * Filter in the itapapersApp.
 */
angular.module('itapapersApp')
  .filter('capitalise', function () {
    return function(input, all) {
      var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
      return (!!input) ? input.replace(reg, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }) : '';
    };
  })
  .filter('capitaliseFirst', function () {
    return function(input, all) {
      return input.replace(/^(.)|\s(.)/g, function(v) {
        return v.toUpperCase( );
      });
    };
  })
  .filter('capitaliseFirstOnly', function () {
    return function(input, all) {
      var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
      return (!!input) ? input.replace(reg, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1);
      }) : '';
    };
  });
