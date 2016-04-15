'use strict';

describe('Service: csv', function () {

  // load the service's module
  beforeEach(module('itapapersApp'));

  // instantiate service
  var csv;
  beforeEach(inject(function (_csv_) {
    csv = _csv_;
  }));

  it('should do something', function () {
    expect(!!csv).toBe(true);
  });

});
