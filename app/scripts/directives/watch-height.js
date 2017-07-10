/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

angular.module('scienceLibrary')

.directive('watchHeight', ['$window', function ($window) {
  return {
    link: link,
    restrict: 'A'
  };

  function link(scope) {
    scope.height = $window.innerHeight;

    var headerHeight = 85;
    var margin = 15;
    var footerHeight = 50;

    var interactiveHeaderHeight = (scope.headerHeight || 0) + 80;
    var filterHeight = 33;
    var listMargin = 20;
    var seeMoreHeight = 127;

    var dataMessageHeight = 78;

    scope.$watch('headerHeight', function(newValue) {
      if (newValue) {
        var newHeight = newValue + 80;
        if (interactiveHeaderHeight !== newHeight) {
          interactiveHeaderHeight = newHeight;
          resizeStyles();
        }
      }
    });

    scope.$watch('messageHeight', function(newValue) {
      if (newValue) {
        var newHeight = newValue + 30;
        if (dataMessageHeight !== newHeight) {
          dataMessageHeight = newHeight;
          resizeStyles();
        }
      }
    });

    var resizeStyles = function() {
      var innerContentHeight = $window.innerHeight - (headerHeight + margin * 2 + footerHeight);
      var resultsListHeight = innerContentHeight - (interactiveHeaderHeight +
          filterHeight + listMargin + seeMoreHeight);
      var venuesListHeight = innerContentHeight - (interactiveHeaderHeight + seeMoreHeight);

      scope.height = $window.innerHeight;

      if ($window.innerWidth < 992) {
        scope.innerContentStyle = {};
        scope.resultsListStyle = {};
      } else {
        scope.innerContentStyle = {
          'background': 'white',
          'height': innerContentHeight + 'px'
        };
        scope.resultsListStyle = {
          'height': (resultsListHeight - dataMessageHeight) + 'px'
        };
        scope.authorsListStyle = {
          'height': (resultsListHeight - 19) + 'px'
        };
        scope.venuesListStyle = {
          'height': venuesListHeight + 'px'
        };
      }
    }

    resizeStyles();

    angular.element($window).bind('resize', function() {
      resizeStyles();

      // manual $digest required as resize event
      // is outside of angular
      if (!scope.$$phase) {
        scope.$digest();
      }
    });
  }
}]);
