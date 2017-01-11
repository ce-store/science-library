/* globals process: true */

var express = require('express');
var request = require('request');
var Promise = require('promise');
var path = require('path');
var app = express();

var settings;

try {
  settings = require('./settings');
} catch (e) {
  console.log('Settings not found');
}



if (process.env.NODE_ENV === 'production') {
  app.use('/fonts', express.static(path.join(__dirname, 'dist', 'fonts')));
  app.use('/i', express.static(path.join(__dirname, 'dist', 'i')));
  app.use('/scripts', express.static(path.join(__dirname, 'dist', 'scripts')));
  app.use('/styles', express.static(path.join(__dirname, 'dist', 'styles')));
} else {
  app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
  app.use('/i', express.static(path.join(__dirname, 'app', 'i')));
  app.use('/scripts', express.static(path.join(__dirname, 'app', 'scripts')));
  app.use('/styles', express.static(path.join(__dirname, 'app', 'styles')));
  app.use('/views', express.static(path.join(__dirname, 'app', 'views')));
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
      'content-type': 'application/json'
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

var getRules = function() {
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

var getModels = function() {
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

app.get('/model', function (req, res) {
  'use strict';

  if (settings) {
    getModels().then(function(ce) {
      res.send(ce);
    }, function(err) {
      console.log(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(500);
  }
});

app.get('/rules', function (req, res) {
  'use strict';

  if (settings) {
    getRules().then(function(ce) {
      res.send(ce);
    }, function(err) {
      console.log(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(500);
  }
});

app.get('/drupal', function (req, res) {
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
});

app.all('/*', function (req, res) {
  'use strict';

  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
  }
});

// start server on the specified port and binding host
app.listen(3000, function() {
  'use strict';

  console.log("server starting on 3000");
});
