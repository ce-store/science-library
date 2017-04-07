var express = require('express')
var controller = require('./drupal.controller')

var router = express.Router()

router.get('/model', controller.getModel)
router.get('/rules', controller.getRules)
router.get('/documents', controller.getDocuments)

module.exports = router
