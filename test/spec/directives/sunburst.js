'use strict';

describe('Directive: sunburst', function () {

  // load the directive's module
  beforeEach(module('itapapersApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<sunburst></sunburst>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the sunburst directive');
  }));
});
