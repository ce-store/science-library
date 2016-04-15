'use strict';

describe('Service: debug', function () {

  // load the service's module
  beforeEach(module('itapapersApp'));

  // instantiate service
  var debug;
  beforeEach(inject(function (_debug_) {
    debug = _debug_;
  }));

  it('should do something', function () {
    expect(!!debug).toBe(true);
  });

});
