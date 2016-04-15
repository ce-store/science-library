'use strict';

describe('Service: colours', function () {

  // load the service's module
  beforeEach(module('itapapersApp'));

  // instantiate service
  var colours;
  beforeEach(inject(function (_colours_) {
    colours = _colours_;
  }));

  it('should do something', function () {
    expect(!!colours).toBe(true);
  });

});
