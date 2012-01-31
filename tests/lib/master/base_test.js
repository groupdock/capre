'use strict'

var exec = require('child_process').exec
var assert = require('assert')

var Base = require('../../../lib/master/base')

var shared = require('../capre/adaptor_behaviour')

describe('base', function() {
  describe('constructor', function() {
    it('takes a backend', function(done) {
      var backend = 'memory'
      var base = new Base(backend)
      assert.equal(base._backendType, backend)
      done()
    })

    it('also takes an options object', function(done) {
      var backend = 'memory'
      var options = { option: true }
      var base = new Base(backend, options)
      assert.equal(base._backendType, backend)
      assert.equal(base._options, options)
      done()
    })
  })
  describe('instantiate as server', function() {
    var base
    beforeEach(function() {
      base = new Base('memory')
    })
    afterEach(function(done) {
      if (base._backend) return base.shutdown(done)
      done()
    })

    it('can listen on a port', function(done) {
      base.listen(3000, function(err) {
        assert.ok(!err)
        assert.ok(base.capre.flush)
        assert.ok(base.capre.register)
        assert.ok(base._backend)
        done()
      })
    })

    describe('api', function() {
      before(function(done) {
        var self = this
        base.listen(3000, function(err) {
          assert.ok(!err)
          self.capre = base.capre
          done()
        })
      })
      shared.shouldBehaveLikeACapreAdaptor()
    })
  })
  describe('instantiate as client', function() {
    var server
    before(function() {
      server = exec('./bin/capre')
    })
    after(function() {
      server.kill('SIGTERM')
    })
    describe('connecting', function() {
      var base
      before(function() {
        base = new Base()
      })
      it('should be able to connect to running capre server', function(done) {
        base.connect(3000, function(err) {
          assert.ok(!err)
          assert.ok(base.capre.flush)
          assert.ok(base.capre.register)
          assert.ok(base._backend)
          done()
        })
      })
      describe('api', function() {
        before(function() {
          this.capre = base.capre
        })
        shared.shouldBehaveLikeACapreAdaptor()
      })
    })
  })
})

