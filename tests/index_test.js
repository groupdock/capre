'use strict'

var assert = require('assert')

var redis = require('redis')

var Master = require('../lib/master')
var Slave = require('../lib/slave')

describe('capre module', function() {
  var capre
  before(function() {
    capre = require('../index')
  })
  it('exposes master', function() {
    assert.ok(capre.Master)
    assert.equal(capre.Master, Master)
    assert.ok(typeof capre.Master === 'function')
  })
  it('exposes slave', function() {
    assert.ok(capre.Slave)
    assert.equal(capre.Slave, Slave)
    assert.ok(typeof capre.Slave === 'function')
  })
  describe('_connect', function() {
    it('returns a redis client', function() {
      var client = capre._connect()
      assert.ok(client instanceof redis.RedisClient)
    })
    // port and host string passing not tested
  })
  describe('createMaster', function() {
    var master
    before(function() {
      master = capre.createMaster()
    })
    it('returns a capre Master', function() {
      assert.ok(master instanceof Master)
    })
    it('provides a redis client', function() {
      assert.ok(master._client instanceof redis.RedisClient)
    })
  })
  describe('createSlave', function() {
    var slave
    before(function() {
      slave = capre.createSlave()
    })
    it('returns a capre Slave', function() {
      assert.ok(slave instanceof Slave)
    })
    it('provides a redis client', function() {
      assert.ok(slave._client instanceof redis.RedisClient)
    })
  })
})
