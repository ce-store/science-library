'use strict';

describe('Controller: CapstoneCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var CapstoneCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CapstoneCtrl = $controller('CapstoneCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(CapstoneCtrl.awesomeThings.length).toBe(3);
  });
});
