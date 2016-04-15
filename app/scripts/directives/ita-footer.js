'use strict';

/**
 * @ngdoc directive
 * @name itapapersApp.directive:itaFooter
 * @description
 * # itaFooter
 */
angular.module('itapapersApp')
  .directive('itaFooter', ['$location', '$uibModal', 'hudson', 'store', function ($location, $uibModal, hudson, store) {
    return {
      templateUrl: 'views/ita-footer.html',
      restrict: 'E',
      link: function postLink(scope) {
        scope.question = "";

        scope.submit = function () {
          console.log('submit');
          console.log(scope.question);

          hudson.askQuestion(scope.question);
        };

        //Voice To Text
        var listener;

        var reset = function() {
          console.log("reset listener");
          listener = new webspeech.Listener();
          listener.listen("en", function(text) {
            console.log(text);
            scope.question = text;
            angular.element("#question-box")[0].value = text;
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
                  templateUrl: 'views/voice-warning.html',
                  controller: 'VoiceWarningCtrl',
                  size: 'sm'
                });

                modalInstance.result.then(function () {
                  store.setVoiceAcceptance(true);
                  reset();
                }, function () {
                  console.log('Modal dismissed at: ' + new Date());
                });
              }
            });
        };
      }
    };
  }]);
