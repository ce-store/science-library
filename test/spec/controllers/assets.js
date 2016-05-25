'use strict';

describe('Controller: AssetsCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var AssetsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AssetsCtrl = $controller('AssetsCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(AssetsCtrl.awesomeThings.length).toBe(3);
  });
});
