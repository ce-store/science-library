'use strict';

describe('Controller: HelpCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var HelpCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    HelpCtrl = $controller('HelpCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(HelpCtrl.awesomeThings.length).toBe(3);
  });
});
