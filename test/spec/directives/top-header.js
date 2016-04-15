'use strict';

describe('Directive: topHeader', function () {

  // load the directive's module
  beforeEach(module('itapapersApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<top-header></top-header>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the topHeader directive');
  }));
});
