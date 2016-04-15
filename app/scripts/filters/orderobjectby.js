'use strict';

/**
 * @ngdoc filter
 * @name itapapersApp.filter:orderObjectBy
 * @function
 * @description
 * # orderObjectBy
 * Filter in the itapapersApp.
 */
angular.module('itapapersApp')
  .filter('orderObjectBy', function() {
    return function(items, field, secondField, reverse) {
      var filtered = [];
      angular.forEach(items, function(item) {
        filtered.push(item);
      });
      filtered.sort(function (a, b) {
        var newField;
        if (a[field] === b[field]) {
          if (secondField) {

            if (secondField.charAt(0) === '-') {
              newField = secondField.substring(1);
              return (a[newField] > b[newField] ? 1 : -1);
            } else {
              return (a[secondField] < b[secondField] ? 1 : -1);
            }

          } else {
            return 0;
          }
        }

        if (field.charAt(0) === '-') {
          newField = secondField.substring(1);
          return (a[newField] > b[newField] ? 1 : -1);
        } else {
          return (a[field] < b[field] ? 1 : -1);
        }
      });
      if(reverse) {
        filtered.reverse();
      }
      return filtered;
    };
  });
