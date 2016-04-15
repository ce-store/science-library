'use strict';

describe('Service: hudson', function () {

  // load the service's module
  beforeEach(module('itapapersApp'));

  // instantiate service
  var hudson;
  beforeEach(inject(function (_hudson_) {
    hudson = _hudson_;
  }));

  it('should do something', function () {
    expect(!!hudson).toBe(true);
  });

});
