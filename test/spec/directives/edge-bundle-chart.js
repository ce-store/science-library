'use strict';

describe('Directive: edgeBundleChart', function () {

  // load the directive's module
  beforeEach(module('itapapersApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<edge-bundle-chart></edge-bundle-chart>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the edgeBundleChart directive');
  }));
});
