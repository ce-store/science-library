'use strict';

describe('Controller: AddCommentCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var AddCommentCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddCommentCtrl = $controller('AddCommentCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(AddCommentCtrl.awesomeThings.length).toBe(3);
  });
});
