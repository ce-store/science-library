'use strict';

describe('Directive: capitalise', function () {

  // load the directive's module
  beforeEach(module('itapapersApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<capitalise></capitalise>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the capitalise directive');
  }));
});
