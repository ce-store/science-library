'use strict';

describe('Controller: ExperimentationCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var ExperimentationCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ExperimentationCtrl = $controller('ExperimentationCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(ExperimentationCtrl.awesomeThings.length).toBe(3);
  });
});
