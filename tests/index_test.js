'use strict'

var assert = require('assert')

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
})
