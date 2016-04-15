'use strict';

describe('Service: urls', function () {

  // load the service's module
  beforeEach(module('itapapersApp'));

  // instantiate service
  var urls;
  beforeEach(inject(function (_urls_) {
    urls = _urls_;
  }));

  it('should do something', function () {
    expect(!!urls).toBe(true);
  });

});
