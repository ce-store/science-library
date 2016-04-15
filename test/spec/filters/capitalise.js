'use strict';

describe('Filter: capitalise', function () {

  // load the filter's module
  beforeEach(module('itapapersApp'));

  // initialize a new instance of the filter before each test
  var capitalise;
  beforeEach(inject(function ($filter) {
    capitalise = $filter('capitalise');
  }));

  it('should return the input prefixed with "capitalise filter:"', function () {
    var text = 'angularjs';
    expect(capitalise(text)).toBe('capitalise filter: ' + text);
  });

});
