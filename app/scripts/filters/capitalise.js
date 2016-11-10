angular.module('itapapersApp')

.filter('capitalise', function () {
  'use strict';
  return function(input, all) {
    var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
    return (!!input) ? input.replace(reg, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }) : '';
  };
})

.filter('capitaliseFirst', function () {
  'use strict';
  return function(input, all) {
    if (input) {
      return input.replace(/^(.)|\s(.)/g, function(v) {
        return v.toUpperCase( );
      });
    } else {
      return input;
    }
  };
})

.filter('capitaliseFirstOnly', function () {
  'use strict';
  return function(input, all) {
    var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
    return (!!input) ? input.replace(reg, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    }) : '';
  };
});
