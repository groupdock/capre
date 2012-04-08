'use strict'

var restify = require('restify')

var Slave = require('./slave')
var Master = require('./master')
var capre = require('../')
var sanitize = require('./util').sanitize

var mongooseTracker = require('../adaptors/mongoose_tracker')
exports.createServer = function(options) {
  options = options || {}
  var master = options.master || capre.createMaster()
  var slave = options.slave || new Slave(master)

  var server = restify.createServer()
  server.use(restify.bodyParser())
  server.use(restify.acceptParser(server.acceptable))
  server.use(function(req, res, next) {
    if (req.body) return next() // don't format form data
    for(var param in req.params) {
      if (req.params.hasOwnProperty(param)) {
        req.params[param] = sanitize(req.params[param])
      }
    }
    next()
  })
  server.get('/sync/:name/:type', function(req, res, next) {
    mongooseTracker.sync(req.params.name, req.params.type, function(err, result) {
      if (err) return next(err)
      res.send(result)
    })
  })
  //server.post('/mark', function(req, res, next) {
    //var type = sanitize(req.params.type)
    //var id = req.params.id // no sanitization
    //if (req.params.ids) {
      //id = req.params.ids
    //}
    //master.mark(type, id, function(err, syndex) {
      //if (err) return next(err)
      //res.send({
        //syndex: syndex
      //})
    //})
  //})

  return server
}
