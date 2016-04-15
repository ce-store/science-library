'use strict';

/**
 * @ngdoc service
 * @name itapapersApp.debug
 * @description
 * # debug
 * Factory in the itapapersApp.
 */
angular.module('itapapersApp')
  .factory('debug', ['$rootScope', 'localStorageService', function ($rootScope, localStorageService) {
    var state = localStorageService.get("debug");

    var set = function(newState) {
      state = newState;
      localStorageService.set("debug", newState);
      $rootScope.$broadcast('debug');
    };

    var getState = function() {
      return state;
    };

    return {
      set: set,
      getState: getState
    };
  }]);
