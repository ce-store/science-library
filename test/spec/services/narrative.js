'use strict';

describe('Service: narrative', function () {

  // load the service's module
  beforeEach(module('itapapersApp'));

  // instantiate service
  var narrative;
  beforeEach(inject(function (_narrative_) {
    narrative = _narrative_;
  }));

  it('should do something', function () {
    expect(!!narrative).toBe(true);
  });

});
