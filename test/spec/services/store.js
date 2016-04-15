'use strict';

describe('Service: store', function () {

  // load the service's module
  beforeEach(module('itapapersApp'));

  // instantiate service
  var store;
  beforeEach(inject(function (_store_) {
    store = _store_;
  }));

  it('should do something', function () {
    expect(!!store).toBe(true);
  });

});
