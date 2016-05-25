'use strict';

describe('Controller: BookCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var BookCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BookCtrl = $controller('BookCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(BookCtrl.awesomeThings.length).toBe(3);
  });
});
