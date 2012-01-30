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
    assert.ok(capre.master)
    assert.equal(capre.master, Master)
  })
  it('exposes slave', function() {
    assert.ok(capre.slave)
    assert.equal(capre.slave, Slave)
  })
})
