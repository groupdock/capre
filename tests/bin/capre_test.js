'use strict'

var exec = require('child_process').exec

var enode = require('enode')
var assert = require('assert')
var shared = require('../lib/capre/adaptor_behaviour')

describe('capre server executable', function() {
  var PORT = 3000
  var server

  after(function() {
    server.kill('SIGHUP')
  })
  describe('connecting', function() {
    afterEach(function(done) {
      server.once('exit', done)
      server.kill('SIGHUP')
    })
    
    it('should listen and accept connections on default port', function(done) {
      server = exec('./bin/capre')
      var defaultPort = 3000
      var client = new enode.Client().connect(defaultPort, function(err) {
        assert.ok(!err)
        done()
      })
    })
    it('should listen and accept connections on custom port', function(done) {
      var customPort =  7342
      server = exec('./bin/capre -p ' + customPort)
      var client = new enode.Client().connect(customPort, function(err) {
        assert.ok(!err)
        done()
      })
    })
  })
  describe('api communication', function() {
    before(function(done) {
      var self = this
      server = exec('./bin/capre')
      var client = new enode.Client().connect(PORT)
      client.once('ready', function(remote, connection) {
        self.capre = remote
        done()
      })
    })
    shared.shouldBehaveLikeACapreAdaptor()
  })
})
