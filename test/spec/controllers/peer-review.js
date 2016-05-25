'use strict';

describe('Controller: PeerReviewCtrl', function () {

  // load the controller's module
  beforeEach(module('itapapersApp'));

  var PeerReviewCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PeerReviewCtrl = $controller('PeerReviewCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(PeerReviewCtrl.awesomeThings.length).toBe(3);
  });
});
