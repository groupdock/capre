'use strict'

var _ = require('underscore')
var assert = require('assert')
var uuid = require('node-uuid')

var sinon = require('sinon')

var SyncAdaptor = require('../lib/sync_adaptor_mock')

describe('sync adaptor', function() {
  var syncAdaptor
  beforeEach(function() {
    syncAdaptor = new SyncAdaptor()
  })
  describe('register', function() {
    it('can register types', function(done) {
      var type = 'SomeType'
      syncAdaptor.register(type, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 0)
        done()
      })
    })
    it('will error if already registered type', function(done) {
      var type = 'SomeType'
      syncAdaptor.register(type, function(err, syndex) {
        syncAdaptor.register(type, function(err, syndex) {
          assert.ok(err)
          assert.ok(/exists/.test(err.message))
          done()
        })
      })
    })
  })
  describe('getTypes', function() {
    it('should be able to get registered types', function(done) {
      var userType = 'User'
      var streamType = 'Stream'
      syncAdaptor.register(userType, function(err) {
        assert.ok(!err)
        syncAdaptor.register(streamType, function(err) {
          assert.ok(!err)
          syncAdaptor.getTypes(function(err, types) {
            assert.ok(!err)
            assert.ok(types)
            assert.equal(types.length, 2)
            assert.ok(_.find(types, function(item) {
              return item === userType
            }))
            assert.ok(_.find(types, function(item) {
              return item === streamType
            }))
            done()
          })
        })
      })
    })
  })
  describe('getSyndex', function() {
    var syncAdaptor
    var type = 'User'
    before(function(done) {
      syncAdaptor = new SyncAdaptor()
      syncAdaptor.register(type, function(err) {
        assert.ok(!err)
        done()
      })
    })
    it('should be able to get syndex for a type', function(done) {
      var type = 'User'
      
      syncAdaptor.getSyndex(type, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 0)
        done()
      })
    })
    it('should error if getting syndex of unknown type', function(done) {
      var unknownType = 'unknownType'
      syncAdaptor.getSyndex(unknownType, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
        done()
      })
    })
    it('should be able to get syndex for an id', function(done) {
      var id = uuid()
      syncAdaptor.create(type, id, function() {
        syncAdaptor.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          done()
        })
      })
    })
    it('should return null for getting syndex of unknown id', function(done) {
      var nonExistingID = uuid()
      syncAdaptor.getSyndex(type, nonExistingID, function(err, syndex) {
        assert.ok(!err)
        assert.strictEqual(syndex, null)
        done()
      })
    })
    it('should return err for getting syndex of unknown type', function(done) {
      var nonExistingID = uuid()
      var unknownType = 'unknownType'
      syncAdaptor.getSyndex(unknownType, nonExistingID, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
        done()
      })
    })
  })
  describe('create', function() {
    var type = 'User'
    beforeEach(function(done) {
      syncAdaptor.register(type, done)
    })
    it('should be able to create an object of type', function(done) {
      var objectId = uuid()
      syncAdaptor.create(type, objectId, function(err, syndex) {
        assert.ok(!err, err)
        assert.equal(syndex, 1)
        syncAdaptor.getSyndex(type, objectId, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          done()
        })
      })
    })
    it('should increase syndex each time', function(done) {
      var NUM_ITEMS = 100
      // purposely match i with increasing syndex
      var count = 0;
      for (var i = 1; i <= NUM_ITEMS; i++) {
        var objectId = uuid()
        // because of async, need to fix value of i to function scope
        var create = function(i) {
          syncAdaptor.create(type, objectId, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, i)
            if (count++ === NUM_ITEMS - 1) done()
          })
        }
        create(i)
      }
    })
    it('should return err for creating on unknown type', function(done) {
      var id = uuid()
      var unknownType = 'unknownType'
      syncAdaptor.create(unknownType, id, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
        done()
      })
    })

  })
})
