'use strict'

var exec = require('child_process').exec
var assert = require('assert')

var Master = require('../../../lib/master')
var shared = require('../capre/adaptor_behaviour')

describe('master', function() {
  describe('create instantiation', function() {
    var master
    before(function() {
      master = new Master()
    })

    it('creates own capre instance', function(done) {
      master.create(function(err) {
        assert.ok(!err)
        assert.ok(master.flush)
        assert.ok(master.register)
        done()
      })
    })
    describe('api', function() {
      before(function(done) {
        var self = this
        master.create(function(err) {
          assert.ok(!err)
          self.capre = master
          done()
        })
      })
      shared.shouldBehaveLikeACapreAdaptor()
    })
  })
  describe('connect instantiation', function() {
    var server
    before(function() {
      server = exec('./bin/capre')
    })
    after(function() {
      server.kill('SIGTERM')
    })
    describe('connecting', function() {
      var master
      before(function() {
        master = new Master()
      })
      it('should be able to connect to running capre server', function(done) {
        master.connect(3000, function(err, remote, connection) {
          assert.ok(!err)
          assert.ok(remote)
          assert.ok(connection)
          done()
        })
      })
      describe('api', function() {
        before(function() {
          this.capre = master
        })
        shared.shouldBehaveLikeACapreAdaptor()
      })
    })
  })
})
