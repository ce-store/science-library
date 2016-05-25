'use strict';

describe('Controller: QprsCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var QprsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    QprsCtrl = $controller('QprsCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(QprsCtrl.awesomeThings.length).toBe(3);
  });
});
