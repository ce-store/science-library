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
    var buttonContainerHeight = 127;

    var dataMessageHeight = 78;
    var documentTitleHeight = 78;
    var documentDLHeight = 42;
    var mapHeight = 300;

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
          filterHeight + listMargin + buttonContainerHeight);
      var venuesListHeight = innerContentHeight - (interactiveHeaderHeight + buttonContainerHeight);

      scope.height = $window.innerHeight;

      if ($window.innerWidth < 992) {
        scope.innerContentStyle = {};
        scope.resultsListStyle = {};
        scope.documentStyle = {
          image: {},
          details: {},
          abstract: {}
        };
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
        scope.documentStyle = {
          image: {
            'max-height': innerContentHeight - (documentTitleHeight + buttonContainerHeight) + 'px'
          },
          details: {
            'max-height': innerContentHeight - (documentTitleHeight + 20) + 'px',
            'overflow': 'scroll',
            'margin-bottom': '20px'
          },
          abstract: {
            'max-height': innerContentHeight - (documentTitleHeight + documentDLHeight * 7.5 + mapHeight +
                          buttonContainerHeight) + 'px'
          }
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
