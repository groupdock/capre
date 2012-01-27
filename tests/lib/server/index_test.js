'use strict'
var Server = require('../../../lib/server/')
var assert = require('assert')

var enode = require('enode')

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
  it('should listen on a particular port', function(done) {
    var server = new Server('memory').listen(5000)
    server.on('ready', function() {
      isPortTaken(PORT, function(err, taken) {
        assert.ok(taken)
        done()
      })
    })
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
})
