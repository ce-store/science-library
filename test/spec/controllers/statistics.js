'use strict';

describe('Controller: StatisticsCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var StatisticsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    StatisticsCtrl = $controller('StatisticsCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(StatisticsCtrl.awesomeThings.length).toBe(3);
  });
});
