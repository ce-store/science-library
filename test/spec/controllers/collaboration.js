'use strict';

describe('Controller: CollaborationCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var CollaborationCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CollaborationCtrl = $controller('CollaborationCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(CollaborationCtrl.awesomeThings.length).toBe(3);
  });
});
