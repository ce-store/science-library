'use strict';

describe('Controller: VoiceWarningCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var VoiceWarningCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    VoiceWarningCtrl = $controller('VoiceWarningCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(VoiceWarningCtrl.awesomeThings.length).toBe(3);
  });
});
