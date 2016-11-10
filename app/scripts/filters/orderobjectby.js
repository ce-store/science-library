angular.module('itapapersApp')

.filter('orderObjectBy', function() {
  'use strict';

  return function(items, field, secondField, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      if (a[field] === b[field]) {
        if (secondField) {
          var newSecondField = secondField.substring(1);

          if (secondField.charAt(0) === '-') {
            return (a[newSecondField] > b[newSecondField] ? 1 : -1);
          } else if (secondField.charAt(0) === '+') {
            return (a[newSecondField] < b[newSecondField] ? 1 : -1);
          } else {
            return (a[secondField] < b[secondField] ? 1 : -1);
          }

        } else {
          return 0;
        }
      } else {
        var newField = field.substring(1);

        if (field.charAt(0) === '-') {
          return (a[newField] > b[newField] ? 1 : -1);
        } else if (field.charAt(0) === '+') {
          return (a[newField] < b[newField] ? 1 : -1);
        } else {
          return (a[field] < b[field] ? 1 : -1);
        }
      }
    });
    if(reverse) {
      filtered.reverse();
    }
    return filtered;
  };
});
