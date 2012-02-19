'use strict'

var CapreRedisAdaptor = require('../../../lib/capre/adaptors/redis')
var CapreMemoryAdaptor = require('../../../lib/capre/adaptors/memory')
var CapreJSONAdaptor = require('../../../lib/capre/adaptors/json')

var Capre = require('../../../lib/capre/')

var shared = require('./adaptor_behaviour')

describe('capre', function() {
  describe('memory adaptor', function() {
    before(function(done){
      var self = this
      var backend = new CapreMemoryAdaptor(function() {
        self.capre = new Capre(backend, done)
      })
    })
    shared.shouldBehaveLikeACapreAdaptor()
  })
  describe('redis adaptor', function() {
    before(function(done){
      var redis = require("redis")
      var self = this
      var backend = new CapreRedisAdaptor(function() {
        var client = redis.createClient()
        if (client.ready) return self.capre = new Capre(backend, done)
        client.on('ready', function() {
          client.flushdb(function() {
            self.capre = new Capre(backend, done)
          })
        })
      })
    })
    shared.shouldBehaveLikeACapreAdaptor()
  })
  describe('json adaptor', function() {
    var fs = require('fs')
    var path = require('path')
    var mkdirp = require('mkdirp')
    var PATH = 'tests/tmp/slave.json'

    before(function(done){
      var self = this
      mkdirp(path.dirname(PATH), function() {
        var options = {
          path: PATH
        }
        var backend = new CapreJSONAdaptor(options, function() {
          self.capre = new Capre(backend, done)
        })
      })
    })
    after(function(done) {
      fs.unlink(path.join(PATH), function(err) {
        if (err && err.code != 'ENOENT') {
          done(err)
        } else {
          done()
        }
      })
    })

    shared.shouldBehaveLikeACapreAdaptor()
  })
})
