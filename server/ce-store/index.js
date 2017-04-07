var express = require('express')
var controller = require('./ce-store.controller')

var router = express.Router()

router.get('/keywords/:keywords', controller.getKeywords)

router.post('/save', controller.addCE)
router.post('/query', controller.query)
router.post('/hudson/interpreter', controller.postQuestion)

module.exports = router
