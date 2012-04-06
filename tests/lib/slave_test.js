'use strict'

var assert = require('assert')

var uuid = require('node-uuid')
var async = require('async')
var redis = require('redis')

var Master = require('../../lib/master')
var Slave = require('../../lib/slave')
var capre = require('../../')

var helpers = require('../helpers')
var sanitize = require('../../lib/util').sanitize

describe('slave', function() {
  var NUM_ITEMS = 30
  var type = 'User'
  var name = 'Some Application'
  var anotherName = 'Another App'
  var master, slave, client
  var generateItems

  before(function() {
    master = capre.createMaster()
    slave = new Slave(master)
    generateItems = helpers.generateItems(master)
  })
  afterEach(function(done) {
    master.flush(done)
  })

  describe('constructor', function() {
    assert.throws(function() {
      var slave = new Slave(null)
    })
  })
  describe('flush', function() {
    var markedItems
    beforeEach(function(done) {
      generateItems(type, NUM_ITEMS, function(err, generatedItems) {
        assert.ifError(err)
        markedItems = generatedItems
        done()
      })
    })
    it('should not error if not synced yet', function(done) {
      slave.flush(name, function(err) {
        assert.ifError(err)
        done()
      })
    })
    it('should error if not supplied a name', function(done) {
      slave.flush(function(err) {
        assert.ok(err)
        assert.ok(/name is required/.test(err.message))
        done()
      })
    })
    it('should flush data', function(done) {
      slave.sync(name, type, function(err, items) {
        assert.ifError(err)
        assert.deepEqual(markedItems, items)
        slave.flush(name, function(err) {
          assert.ifError(err)
          assert.deepEqual(markedItems, items)
          done()
        })
      })
    })
    it('should only flush data for "name"', function(done) {
      slave.sync(name, type, function(err, items) {
        assert.ifError(err)
        assert.deepEqual(markedItems, items)
        slave.sync(name, type, function(err, items) {
          assert.ifError(err)
          slave.sync(anotherName, type, function(err, items) {
            assert.ifError(err)
            slave.flush(name, function(err) {
              assert.ifError(err)
              slave.sync(anotherName, type, function(err, items) {
                assert.ifError(err)
                assert.deepEqual([], items)
                done()
              })
            })
          })
        })
      })
    })
  })
  describe('sync', function() {
    it('errors if not provided a name', function(done) {
      slave.sync(undefined, type, function(err, items, syndex) {
        assert.ok(err)
        assert.ok(/name is required/.test(err.message))
        done()
      })
    })
    it('errors if not provided a type', function(done) {
      slave.sync(name, function(err, items, syndex) {
        assert.ok(err)
        assert.ok(/type is required/.test(err.message))
        done()
      })
    })
    describe('with no data', function() {
      it('successfully syncs with no items', function(done) {
        slave.sync(name, type, function(err, items, syndex) {
          assert.ifError(err)
          assert.deepEqual(items, [])
          assert.strictEqual(syndex, 0)
          done()
        })
      })
    })
    describe('with data', function() {
      var markedItems
      beforeEach(function(done) {
        generateItems(type, NUM_ITEMS, function(err, generatedItems) {
          assert.ifError(err)
          markedItems = generatedItems
          done()
        })
      })
      afterEach(function(done) {
        master.flush(done)
      })
      it('should get all items when not yet synced', function(done) {
        slave.sync(name, type, function(err, items, syndex) {
          assert.ifError(err)
          assert.deepEqual(items, markedItems)
          assert.strictEqual(syndex, NUM_ITEMS)
          done()
        })
      })
      it('should just return current syndex and empty items if already uptodate', function(done) {
        slave.sync(name, type, function(err, items, syndex) {
          assert.ifError(err)
          slave.sync(name, type, function(err, items, syndex) {
            assert.deepEqual([], items)
            assert.strictEqual(syndex, NUM_ITEMS)
            done()
          })
        })
      })
      it('sanitizes data', function(done) {
        slave.sync(sanitize(name), sanitize(type), function(err, items, syndex) {
          assert.ifError(err)
          assert.deepEqual(items, markedItems)
          assert.strictEqual(syndex, NUM_ITEMS)
          done()
        })
      })
      it('should get new items after marked', function(done) {
        var newItems
        slave.sync(name, type, function(err, items, syndex) {
          generateItems(type, NUM_ITEMS, function(err, generatedItems) {
            assert.ifError(err)
            newItems = generatedItems
            slave.sync(name, type, function(err, items, syndex) {
              assert.ifError(err)
              assert.deepEqual(items, newItems)
              assert.strictEqual(syndex, NUM_ITEMS * 2)
              done()
            })
          })
        })
      })
      it('should sync names independently', function(done) {
        slave.sync(name, type, function(err, items, syndex) {
          assert.ifError(err)
          slave.sync(anotherName, type, function(err, items, syndex) {
            assert.deepEqual(items, markedItems)
            assert.strictEqual(syndex, NUM_ITEMS)
            done()
          })
        })
      })
    })
  })
})
