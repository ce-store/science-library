/* globals process: true */

var express = require('express');
var path = require('path');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json({
  limit: '50mb'
}));

require('./server/routes')(app);

if (process.env.NODE_ENV === 'production') {
  console.log('production')
  app.use('/fonts', express.static(path.join(__dirname, 'dist', 'fonts')));
  app.use('/i', express.static(path.join(__dirname, 'dist', 'i')));
  app.use('/scripts', express.static(path.join(__dirname, 'dist', 'scripts')));
  app.use('/styles', express.static(path.join(__dirname, 'dist', 'styles')));
} else {
  console.log('development')
  app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
  app.use('/i', express.static(path.join(__dirname, 'app', 'i')));
  app.use('/scripts', express.static(path.join(__dirname, 'app', 'scripts')));
  app.use('/styles', express.static(path.join(__dirname, 'app', 'styles')));
  app.use('/views', express.static(path.join(__dirname, 'app', 'views')));
}

app.all('/*', function (req, res) {
  'use strict';

  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
  }
});

// start server on the specified port and binding host
var port = 3000
app.listen(port, function() {
  'use strict';

  console.log('server starting on ' + port);
});
