module.exports = function (app) {
  'use strict'

  app.use('/drupal', require('./drupal'))
  app.use('/ce-store', require('./ce-store'))
}
