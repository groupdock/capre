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
      syncAdaptor.insert(type, id, function() {
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
  describe('insert', function() {
    var type = 'User'
    beforeEach(function(done) {
      syncAdaptor.register(type, done)
    })
    it('should be able to insert an object of type', function(done) {
      var id = uuid()
      syncAdaptor.insert(type, id, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 1)
        syncAdaptor.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          done()
        })
      })
    })
    it('should increase syndex each insert', function(done) {
      var NUM_ITEMS = 100
      // purposely match i with increasing syndex
      var count = 0;
      for (var i = 1; i <= NUM_ITEMS; i++) {
        var id = uuid()
        // because of async, need to fix value of i to function scope
        var insert = function(i) {
          syncAdaptor.insert(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, i)
            if (count++ === NUM_ITEMS - 1) done()
          })
        }
        insert(i)
      }
    })
    it('should return err if inserting item with existing id', function(done) {
      var id = uuid()
      syncAdaptor.insert(type, id, function(err, syndex) {
        syncAdaptor.insert(type, id, function(err, syndex) {
          assert.ok(err)
          assert.ok(/duplicate/.test(err.message))
          syncAdaptor.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, 1)
            done()
          })
        })
      })
    })
    it('should not return err for inserting on unknown type', function(done) {
      var id = uuid()
      var unknownType = 'unknownType'
      syncAdaptor.insert(unknownType, id, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 1)
        syncAdaptor.getSyndex(unknownType, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          done()
        })
      })
    })
  })
  describe('update', function() {
    var type = 'User'
    var id = uuid()
    beforeEach(function(done) {
      syncAdaptor.register(type, function() {
        syncAdaptor.insert(type, id, function(err, syndex) {
          done()
        })
      })
    })
    it('should be able to update existing id', function(done) {
      syncAdaptor.update(type, id, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 2)
        syncAdaptor.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 2)
          done()
        })
      })
    })
    it('should increase syndex each time', function(done) {
      var NUM_ITEMS = 100
      // purposely match i with increasing syndex
      var count = 0;
      for (var i = 1; i <= NUM_ITEMS; i++) {
        // because of async, need to fix value of i to function scope
        var insert = function(i) {
          syncAdaptor.update(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, i + 1) // syndex 1 will be taken by initial insert
            if (count++ === NUM_ITEMS - 1) done()
          })
        }
        insert(i)
      }
    })
    it('should return err for updating on unknown type', function(done) {
      var unknownType = 'unknownType'
      syncAdaptor.update(unknownType, id, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
        done()
      })
    })
    it('should return err for updating on unknown item', function(done) {
      var unknownId = 'unknownid'
      syncAdaptor.update(type, unknownId, function(err, syndex) {
        assert.ok(err)
        assert.ok(/not found/.test(err.message))
        done()
      })
    })
  })
  describe('upsert', function() {
    var type = 'User'
    var id = uuid()
    beforeEach(function(done) {
      syncAdaptor.register(type, function() {
        syncAdaptor.upsert(type, id, function(err, syndex) {
          done()
        })
      })
    })
    it('should be able to update existing id', function(done) {
      syncAdaptor.upsert(type, id, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 2)
        syncAdaptor.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 2)
          done()
        })
      })
    })
    it('should be able to upsert a new object of type', function(done) {
      var id = uuid()
      syncAdaptor.upsert(type, id, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 2) // remember, we inserted on in the beforeEach
        syncAdaptor.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 2)
          done()
        })
      })
    })

    it('should increase syndex each time', function(done) {
      var NUM_ITEMS = 100
      // purposely match i with increasing syndex
      var count = 0;
      for (var i = 1; i <= NUM_ITEMS; i++) {
        // because of async, need to fix value of i to function scope
        var insert = function(i) {
          syncAdaptor.upsert(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, i + 1) // syndex 1 will be taken by initial insert
            if (count++ === NUM_ITEMS - 1) done()
          })
        }
        insert(i)
      }
    })
    it('should not return err for upserting on unknown type', function(done) {
      var id = uuid()
      var unknownType = 'unknownType'
      syncAdaptor.upsert(unknownType, id, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 1)
        syncAdaptor.getSyndex(unknownType, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          done()
        })
      })
    })
  })
  describe('sync', function(type, syndex) {
    var type = 'User'
    it('should get ids > supplied index', function(done) {
      var id1 = uuid()
      syncAdaptor.insert(type, id1, function(err) {
        assert.ok(!err)
        var id2 = uuid()
        syncAdaptor.insert(type, id2, function(err, syndex) {
          assert.ok(!err)
          var currentSyndex = syndex - 1
          // we want to grab just this most recent item
          syncAdaptor.sync(type, currentSyndex, function(err, items, returnedSyndex) {
            assert.ok(!err)
            assert.equal(items.length, 1)
            assert.equal(syndex, returnedSyndex)
            assert.equal(items[0], id2)
            done()
          })
        })
      })
    })
    describe('bulk', function() {
      var NUM_ITEMS = 100
      beforeEach(function() {
        var count = 0
        for (var i = 0; i < NUM_ITEMS; i++) {
          var id = uuid()
          syncAdaptor.insert(type, id, function(err) {
            assert.ok(!err)
            if (count++ === NUM_ITEMS) done()
          })
        }
      })
      it('should get all ids > supplied index', function(done) {
        var currentSyndex = 12
        syncAdaptor.sync(type, currentSyndex, function(err, items, syndex) {
          assert.ok(!err)
          assert.equal(items.length, NUM_ITEMS - currentSyndex)
          done()
        })
      })
    })
    //it('shouldn\'t err for unknown types', function(done) {
      //var syndex = 12
      //syncAdaptor.sync(type, syndex, function(err, items, syndex) {
        //assert.ok(!err)
        //assert.equal(items.length, NUM_ITEMS - syndex)
        //assert.ok(_.every(function(item) {
          //return item.syndex > syndex
        //}))
        //done()
      //})
    //})
  })


})
