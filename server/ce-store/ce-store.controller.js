var request = require('request')
var settings;

try {
  settings = require('../../settings');
} catch (e) {
  console.log('Settings not found');
}

var getKeywords = function (req, res) {
  'use strict';

  if (settings) {
    var ce = settings.ce_store;
    var keywords = req.params.keywords;

    var options = {
      method: 'GET',
      url: ce.endpoint + ce.store + ce.special.keywords + keywords + ce.special.keyword_restrictions
    };

    request(options, function (error, response, body) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send(body);
      }
    });
  } else {
    res.sendStatus(500);
  }
}

var addCE = function (req, res) {
  'use strict';

  if (settings) {
    var ce = settings.ce_store;

    var options = {
      method: 'POST',
      url: ce.endpoint + ce.store + ce.save,
      body: req.body.ce
    };

    request(options, function (error, response, body) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send(body);
      }
    });
  } else {
    res.sendStatus(500);
  }
}

var query = function (req, res) {
  'use strict';

  if (settings) {
    var ce = settings.ce_store;

    var options = {
      method: 'GET',
      url: ce.endpoint + ce.store + req.body.url
    };

    request(options, function (error, response, body) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send(body);
      }
    });
  } else {
    res.sendStatus(500);
  }
}

var postQuestion = function (req, res) {
  'use strict';

  if (settings) {
    var ce = settings.ce_store;

    var options = {
      method: 'POST',
      url: ce.endpoint + ce.special.interpreter,
      body: req.body.question
    };

    request(options, function (error, response, body) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send(body);
      }
    });
  } else {
    res.sendStatus(500);
  }
}

module.exports = {
  getKeywords: getKeywords,
  addCE: addCE,
  query: query,
  postQuestion: postQuestion
}
