'use strict';

describe('Controller: CmcCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var CmcCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CmcCtrl = $controller('CmcCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(CmcCtrl.awesomeThings.length).toBe(3);
  });
});
