var request = require('request')
var Promise = require('promise');
var settings;

try {
  settings = require('../../settings');
} catch (e) {
  console.log('Settings not found');
}

var getToken = function() {
  'use strict';

  var options = {
    method: 'POST',
    url: settings.drupal_endpoint + '/api/user/token',
    headers: {
      'content-type': 'application/json'
    },
    json: true
  };

  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        resolve(body.token);
      }
    });
  });
};

var login = function(token) {
  'use strict';

  var options = {
    method: 'POST',
    url: settings.drupal_endpoint + '/api/user/login',
    headers: {
      'x-csrf-token': token,
      'content-type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: settings.credentials,
    json: true
  };

  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
};

var createPromise = function(options) {
  'use strict';

  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
};

var getRulesPromise = function() {
  'use strict';

  var options = {
    method: 'GET',
    url: settings.rules_endpoint
  };

  return createPromise(options);
};

var getCE = function(token, session) {
  'use strict';

  var promises = [];

  for (var i in settings.files) {
    var file = settings.files[i];
    var options = {
      method: 'GET',
      url: settings.drupal_endpoint + '/' + file,
      headers: {
        'x-csrf-token': token,
        'content-type': 'application/json',
        'Cookie': session.session_name + '=' + session.sessid
      },
      json: true
    };

    var promise = createPromise(options);
    promises.push(promise);
  }

  return Promise.all(promises);
};

var getModelsPromise = function() {
  'use strict';

  var promises = [];
  var file, options, promise, i;

  for (i in settings.models) {
    file = settings.models[i];
    options = {
      method: 'GET',
      url: settings.model_endpoint + '/' + file
    };

    promise = createPromise(options);
    promises.push(promise);
  }

  for (i in settings.agents) {
    file = settings.agents[i];
    options = {
      method: 'GET',
      url: settings.agents_endpoint + '/' + file
    };

    promise = createPromise(options);
    promises.push(promise);
  }

  return Promise.all(promises);
};

var getModel = function (req, res) {
  'use strict';

  if (settings) {
    getModelsPromise().then(function(ce) {
      res.send(ce);
    }, function(err) {
      console.log(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(500);
  }
}

var getRules = function (req, res) {
  'use strict';

  if (settings) {
    getRulesPromise().then(function(ce) {
      res.send(ce);
    }, function(err) {
      console.log(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(500);
  }
}

var getDocuments = function (req, res) {
  'use strict';

  if (settings) {
    getToken().then(function(token) {
      login(token).then(function(session) {
        getCE(token, session).then(function(html) {
          res.send(html);
        }, function(err) {
          console.log(err);
          res.sendStatus(500);
        });
      }, function(err) {
        console.log(err);
        res.sendStatus(500);
      });
    }, function(err) {
      console.log(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(500);
  }
}

module.exports = {
  getModel: getModel,
  getRules: getRules,
  getDocuments: getDocuments
}
