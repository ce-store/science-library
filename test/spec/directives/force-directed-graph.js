'use strict';

describe('Directive: forceDirectedGraph', function () {

  // load the directive's module
  beforeEach(module('itapapersApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<force-directed-graph></force-directed-graph>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the forceDirectedGraph directive');
  }));
});
