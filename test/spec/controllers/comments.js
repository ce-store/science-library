'use strict';

describe('Controller: CommentsCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var CommentsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CommentsCtrl = $controller('CommentsCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(CommentsCtrl.awesomeThings.length).toBe(3);
  });
});
