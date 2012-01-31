'use strict'

var Server = require('../../../lib/server/')
var assert = require('assert')
var enode = require('enode')
var mockery = require('mockery')

var shared = require('../capre/adaptor_behaviour')

var isPortTaken = function(port, callback) {
  var net = require('net')
  var tester = net.createServer()
  tester.once('error', function (err) {
    if (err.code == 'EADDRINUSE') {
      callback(null, true)
    } else {
      callback(err)
    }
  })
  tester.once('listening', function() {
    tester.once('close', function() {
      callback(null, false)
    })
    tester.close()
  })
  tester.listen(port)
}


describe('server', function() {
  var PORT = 5000
  var server
  after(function(done) {
    if (server) {
      server.shutdown(done)
    } else {
      done()
    }
  })
  describe('startup', function() {
    it('should listen on a particular port', function(done) {
      server = new Server('memory').listen(PORT)
      server.on('ready', function() {
        isPortTaken(PORT, function(err, taken) {
          assert.ok(taken)
          done()
        })
      })
    })
    it('should be able to shutdown', function(done) {
      server.shutdown(function() {
        isPortTaken(PORT, function(err, taken) {
          assert.ok(!taken)
          done()
        })
      })
    })
    it('should be able to shutdown multiple times', function(done) {
      server.shutdown(function() {
        server.shutdown(function() {
          isPortTaken(PORT, function(err, taken) {
            assert.ok(!taken)
            done()
          })
        })
      })
    })

    it('should have capre lib as an _api after listen', function(done) {
      server = new Server('memory').listen(PORT, function(err) {
        assert.ok(!err)
        assert.ok(server._api)
        assert.ok(server._api.flush)
        assert.ok(server._api.register)
        assert.ok(server._api.getSyndex)
        server.shutdown(done)
      })
    })
    describe('api', function() {
      before(function(done) {
        var self = this
        server = new Server('memory').listen(PORT, function(err) {
          self.capre = server.capre
          done()
        })
      })
      after(function(done) {
        server.shutdown(done)
      })
      shared.shouldBehaveLikeACapreAdaptor()
    })
  })
  describe('communication', function() {
    before(function(done) {
      server = new Server('memory').listen(5000, done)
    })
    it('should expose server api to connected clients', function(done) {
      var client = new enode.Client().connect(PORT)
      client.once('ready', function(remote) {
        remote.register('User', function() {
          remote.insert('User', 'someId', function() {
            remote.getSyndex('User', function(err, syndex) {
              assert.equal(syndex, 1)
              done()
            })
          })
        })
      })
    })
    it('should send string versions of errors', function(done) {
      var client = new enode.Client().connect(PORT)
      client.once('ready', function(remote) {
        // should produce error
        var unknownType = 'lorem'
        remote.getSyndex(unknownType, function(err) {
          assert.ok(err)
          assert.equal(err, 'Error: unknown type: lorem')
          assert.ok(typeof err === 'string')
          done()
        })
      })
    })
  })
  describe('support for various backends, including', function() {
    var MemoryBackend = require('../../../lib/capre/adaptors/memory')
    var JSONBackend = require('../../../lib/capre/adaptors/json')
    var RedisBackend = require('../../../lib/capre/adaptors/redis')
    it('memory', function() {
      var server = new Server('memory')
      assert.ok(server.backend instanceof MemoryBackend)
    })
    it('json', function() {
      var PATH = 'tests/tmp/slave.json'
      var options = {
        file: PATH
      }
      var server = new Server('json', options)
      assert.ok(server.backend instanceof JSONBackend)
    })
    it('redis', function() {
      var server = new Server('redis')
      assert.ok(server.backend instanceof RedisBackend)
    })
    describe('passing options to various backends', function() {
      before(function() {
        mockery.enable()
      })
      after(function() {
        mockery.disable()
      })
      it('memory', function(done) {
        var options = {}
        mockery.registerMock('../capre/adaptors/memory', function(passedOptions, callback) {
          assert.deepEqual(passedOptions, options)
          server = null // cleanup
          done()
        })
        var server = new Server('memory', options)
      })
      it('json', function(done) {
        var PATH = 'tests/tmp/slave.json'
        var options = {
          file: PATH
        }
        mockery.registerMock('../capre/adaptors/json', 
                             function(passedOptions, callback) {
          assert.deepEqual(passedOptions, options)
          server = null // cleanup
          done()
        })
        var server = new Server('json', options)
      })
      it('redis', function(done) {
        var options = {}
        mockery.registerMock('../capre/adaptors/redis', 
                             function(passedOptions, callback) {
          assert.deepEqual(passedOptions, options)
          server = null // cleanup
          done()
        })
        var server = new Server('redis', options)
      })
    })
  })
})
