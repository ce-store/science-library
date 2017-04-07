/*******************************************************************************
 * (C) Copyright IBM Corporation  2016, 2017
 * All Rights Reserved
 *******************************************************************************/

/* globals webspeech: true */

angular.module('itapapersApp')

.directive('itaFooter', ['$location', '$uibModal', 'hudson', 'store', function ($location, $uibModal, hudson, store) {
  'use strict';

  return {
    templateUrl: 'views/ita-footer.html',
    restrict: 'E',
    link: function postLink(scope) {
      scope.question = '';

      scope.submit = function () {
        hudson.askQuestion(scope.question);
      };

      //Voice To Text
      var listener;

      var reset = function() {
        listener = new webspeech.Listener();
        listener.listen('en', function(text) {
          scope.question = text;
          angular.element('#question-box')[0].value = text;
          hudson.askQuestion(text);
        });
      };

      scope.resetListener = function () {
        store.getVoiceAcceptance()
          .then(function(accepted) {
            if (accepted) {
              reset();
            } else {
              var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/science-library/voice-warning.html',
                controller: 'VoiceWarningCtrl',
                size: 'sm'
              });

              modalInstance.result.then(function () {
                store.setVoiceAcceptance(true);
                reset();
              });
            }
          });
      };
    }
  };
}]);
