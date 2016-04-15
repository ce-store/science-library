'use strict';

describe('Controller: VenueCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var VenueCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    VenueCtrl = $controller('VenueCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(VenueCtrl.awesomeThings.length).toBe(3);
  });
});
