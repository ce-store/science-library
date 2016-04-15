'use strict';

describe('Controller: OrganisationCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var OrganisationCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    OrganisationCtrl = $controller('OrganisationCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(OrganisationCtrl.awesomeThings.length).toBe(3);
  });
});
