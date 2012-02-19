'use strict'

var _ = require('underscore')
var assert = require('assert')
var uuid = require('shortid')

var sinon = require('sinon')

var Capre = require('../../../lib/capre/')
var CapreRedisAdaptor = require('../../../lib/capre/adaptors/redis')
var CapreMemoryAdaptor = require('../../../lib/capre/adaptors/memory')
var redis = require("redis")
var async = require('async')

exports.shouldBehaveLikeACapreAdaptor = function(){
  var capre, backend
  var NUM_ITEMS = 20


  function insertMany(type, num, callback) {
    var ids = []
    _.times(num, function() {
      ids.push(uuid())
    })
    capre.getSyndex(type, function(err, syndex) {
      assert.ok(!err, err)
      var beforeSyndex = syndex
      async.forEach(ids, function(id, done) {
        capre.insert(type, id, done)
      }, function(err) {
        assert.ok(!err, err)
        capre.getSyndex(type, function(err, syndex) {
          assert.ok(!err, err)
          var afterSyndex = syndex
          assert.strictEqual(afterSyndex, beforeSyndex + num)
          assert.strictEqual(ids.length, num)
          callback(null, ids)
        })
      })
    })
  }


  before(function() {
    capre = this.capre
  })
  beforeEach(function(done) {
    capre.flush(done)
  })
  after(function(done) {
    capre.flush(done)
  })
  describe('flush', function() {
    it('will flush types', function(done) {
      var type = 'FlushType'
      capre.register(type, function(err, typeData) {
        assert.ok(!err, err)
        capre.flush(function(err) {
          assert.ok(!err)
          capre.getTypes(function(err, types) {
            assert.ok(!err)
            assert.ok(types)
            assert.equal(types.length, 0)
            done()
          })
        })
      })
    })
  })
  describe('register', function() {
    it('can register types', function(done) {
      var type = 'SomeType'
      capre.register(type, function(err, typeData) {
        assert.ok(!err)
        assert.strictEqual(typeData.syndex, 0)
        capre.getTypes(function(err, types) {
          assert.ok(!err)
          assert.ok(types)
          assert.equal(types.length, 1)
          assert.strictEqual(types[0], type)
        })
        done()
      })
    })
    it('will error if registering already registered type', function(done) {
      var type = 'SomeType'
      capre.register(type, function(err, syndex) {
        capre.register(type, function(err, syndex) {
          assert.ok(err)
          assert.ok(/exists/.test(err.toString()))
          done()
        })
      })
    })
  })
  describe('registerIfMissing', function() {
    var type = 'SomeType'
    it('can register types', function(done) {
      capre._registerIfMissing(type, function(err, typeData) {
        assert.ok(!err)
        assert.strictEqual(typeData.syndex, 0)
        capre.getTypes(function(err, types) {
          assert.ok(!err)
          assert.ok(types)
          assert.equal(types.length, 1)
          assert.strictEqual(types[0], type)
          done()
        })
      })
    })
    it('won\'t error if registering already registered type', function(done) {
      capre.register(type, function(err, syndex) {
        capre._registerIfMissing(type, function(err, typeInfo) {
          assert.ok(!err, err)
          assert.ok(typeInfo)
          assert.strictEqual(typeInfo.syndex, 0)
          done()
        })
      })
    })
    it('will not reset existing type', function(done) {
      capre.register(type, function(err) {
        assert.ok(!err)
        capre.bumpSyndex(type, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(syndex, 1)
          capre._registerIfMissing(type, function(err, typeInfo) {
            assert.ok(!err)
            assert.strictEqual(typeInfo.syndex, 1)
            done()
          })
        })
      })
    })
  })
  describe('getTypes', function() {
    it('should give 0 types if no types registered', function(done) {
      capre.getTypes(function(err, types) {
        assert.ok(!err)
        assert.ok(types)
        assert.equal(types.length, 0)
        done()
      })
    })
    it('should be able to get registered types', function(done) {
      var userType = 'User'
      var streamType = 'Stream'
      capre.register(userType, function(err) {
        assert.ok(!err)
        capre.register(streamType, function(err) {
          assert.ok(!err)
          capre.getTypes(function(err, types) {
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
    var type = 'User'
    beforeEach(function(done) {
      capre.register(type, done)
    })
    it('should be able to get numeric syndex for a type', function(done) {
      capre.getSyndex(type, function(err, syndex) {
        assert.ok(!err)
        assert.strictEqual(typeof syndex, 'number')
        assert.strictEqual(syndex, 0)
        done()
      })
    })
    it('should error if getting syndex of unknown type', function(done) {
      var unknownType = 'unknownType'
      capre.getSyndex(unknownType, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.toString()))
        done()
      })
    })
    it('should error if providing no type', function(done) {
      capre.getSyndex(function(err, syndex) {
        assert.ok(err)
        assert.ok(/required/.test(err.toString()))
        done()
      })
    })
    it('should be able to get numeric syndex for an id', function(done) {
      var id = uuid()
      capre.insert(type, id, function(err) {
        assert.ok(!err, err)
        capre.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(typeof syndex, 'number')
          assert.strictEqual(syndex, 1)
          done()
        })
      })
    })
    it('should return null for getting syndex of unknown id', function(done) {
      var nonExistingID = uuid()
      capre.getSyndex(type, nonExistingID, function(err, syndex) {
        assert.ok(!err, err)
        assert.strictEqual(syndex, null)
        done()
      })
    })
    it('should return err for getting syndex of unknown type', function(done) {
      var nonExistingID = uuid()
      var unknownType = 'unknownType'
      capre.getSyndex(unknownType, nonExistingID, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.toString()))
        done()
      })
    })
  })
  describe('get', function() {
    var type = 'User'
    it('should get data for an id', function(done) {
      var id = uuid()
      capre.insert(type, id, function(err) {
        assert.ok(!err)
        capre.get(type, id, function(err, data) {
          assert.ok(!err)
          assert.equal(data.id, id)
          assert.strictEqual(typeof data.syndex, 'number')
          assert.strictEqual(data.syndex, 1)
          done()
        })
      })
    })
  })
  describe('find', function() {
    var type = 'User'
    it('can find a thing', function(done) {
      capre.register(type, function(err) {
        assert.ok(!err, err)
        var id = uuid()
        capre.insert(type, id, function(err) {
          assert.ok(!err, err)
          capre.find(type, id, function(err, found) {
            assert.ok(!err, err)
            assert.ok(found)
            assert.ok(found.id)
            done()
          })
        })
      })
    })
    it('will return null if doesn\'t find anything', function(done) {
      var nonExistentId = uuid()
      capre.register(type, function(err, typeData) {
        assert.ok(!err, err)
        capre.find(type, nonExistentId, function(err, items) {
          assert.ok(!err)
          assert.strictEqual(items, null)
          done()
        })
      })
    })
    it('can find many things', function(done) {
      capre.register(type, function(err, typeData) {
        assert.ok(!err, err)
        insertMany(type, NUM_ITEMS, function(err, ids) {
          assert.ok(!err, err)
          capre.find(type, ids, function(err, items) {
            assert.ok(!err)
            var itemIds = _.pluck(items, 'id')
            assert.deepEqual(itemIds, ids)
            assert.equal(items.length, NUM_ITEMS)
            done()
          })
        })
      })
    })
    it('will return null if doesn\'t find anything', function(done) {
      var nonExistentIds = []
      _.times(NUM_ITEMS, function() {
        nonExistentIds.push(uuid())
      })
      capre.register(type, function(err, typeData) {
        assert.ok(!err, err)
        capre.find(type, nonExistentIds, function(err, items) {
          assert.ok(!err)
          assert.strictEqual(items, null)
          done()
        })
      })
    })
  })
  describe('bumpSyndex', function() {
    var type = 'User'
    beforeEach(function(done) {
      capre.register(type, done)
    })

    it('bumps the syndex for a type', function(done) {
      capre.bumpSyndex(type, function(err, syndex) {
        assert.ok(!err)
        assert.strictEqual(syndex, 1)
        capre.bumpSyndex(type, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(syndex, 2)
          capre.getSyndex(type, function(err, syndex) {
            assert.ok(!err)
            assert.strictEqual(syndex, 2)
            done()
          })
        })
      })
    })
    it('bumps different types independently', function(done) {
      var anotherType = 'anotherType'
      capre.register(anotherType, function() {
        capre.bumpSyndex(type, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(syndex, 1)
          capre.bumpSyndex(anotherType, function(err, syndex) {
            assert.ok(!err)
            capre.getSyndex(anotherType, function(err, syndex) {
              assert.ok(!err)
              assert.strictEqual(syndex, 1)
              capre.getSyndex(type, function(err, syndex) {
                assert.ok(!err)
                assert.strictEqual(syndex, 1)
                done()
              })
            })
          })
        })
      })
    })
    it('produces error if the type is unknown', function(done) {
      var unknownType = 'unknownType'
      capre.bumpSyndex(unknownType, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.toString()))
        done()
      })
    })
  })
  describe('setSyndex', function() {
    var type = 'User'
    beforeEach(function(done) {
      capre.register(type, done)
    })

    it('sets the syndex for a type', function(done) {
      var newSyndex = 7
      capre.setSyndex(type, newSyndex, function(err, syndex) {
        assert.ok(!err)
        assert.strictEqual(syndex, newSyndex)
        newSyndex = 16
        capre.setSyndex(type, newSyndex, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(syndex, newSyndex)
          capre.getSyndex(type, function(err, syndex) {
            assert.ok(!err)
            assert.strictEqual(syndex, newSyndex)
            done()
          })
        })
      })
    })

    it('sets different types independently', function(done) {
      var anotherType = 'anotherType'
      var newSyndex = 7
      capre.register(anotherType, function() {
        capre.setSyndex(type, newSyndex, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(syndex, newSyndex)
          newSyndex = 4
          capre.setSyndex(anotherType, newSyndex, function(err, syndex) {
            assert.ok(!err)
            assert.strictEqual(syndex, 4)
            done()
          })
        })
      })
    })
     it('produces error if setting the syndex to a lower value', function(done) {
      var newSyndex = 7
      capre.setSyndex(type, newSyndex, function(err, syndex) {
        assert.ok(!err)
        assert.strictEqual(syndex, newSyndex)
        newSyndex = 3
        capre.setSyndex(type, newSyndex, function(err, syndex) {
          assert.ok(err)
          assert.ok(/lower/.test(err))
          done()
        })
      })
    })

    it('produces error if the type is unknown', function(done) {
      var unknownType = 'unknownType'
      var newSyndex = 7
      capre.setSyndex(unknownType, newSyndex, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.toString()))
        done()
      })
    })
  })

  describe('insert', function() {
    var type = 'User'
    beforeEach(function(done) {
      capre.register(type, done)
    })
    describe('should be able to insert an object of type', function() {
      var data, id
      beforeEach(function(done) {
        id = uuid()
        capre.insert(type, id, function(err, item) {
          assert.ok(!err)
          assert.ok(item)
          data = item // for tests below
          done()
        })
      })
      describe('returned data', function() {
        it('should have syndex of one', function() {
          assert.strictEqual(data.syndex, 1)
        })
        it('should have supplied id', function() {
          assert.equal(data.id, id)
        })
      })
      it('added to capre list', function(done) {
        capre.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(syndex, 1)
          done()
        })
      })
    })
    it('should increase syndex', function(done) {
      var id = uuid()
      capre.insert(type, id, function(err, item) {
        assert.ok(!err)
        id = uuid()
        capre.insert(type, id, function(err, item) {
          assert.ok(!err)
          id = uuid()
          capre.insert(type, id, function(err, item) {
            assert.ok(!err)
            assert.ok(item)
            assert.strictEqual(item.syndex, 3)
            done()
          })
        })
      })
    })
    it('should increase syndex each insert', function(done) {
      // purposely match i with increasing syndex
      var i = 0;
      // because of async, need to fix value of i to function scope
      var insert = function(i) {
        var id = uuid()
        capre.insert(type, id, function(err, data) {
          assert.ok(!err)
          assert.ok(data)
          assert.strictEqual(data.syndex, i + 1)
          capre.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.strictEqual(syndex, data.syndex)
            if (i < NUM_ITEMS) { 
              insert(++i)
            } else {
              done()
            }
          })
        })
      }
      insert(i)
    })
    it('should return err if inserting item with existing id', function(done) {
      var id = uuid()
      capre.insert(type, id, function(err, data) {
        capre.insert(type, id, function(err, data) {
          assert.ok(err)
          assert.ok(/duplicate/.test(err.toString()))
          capre.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.strictEqual(syndex, 1)
            done()
          })
        })
      })
    })
    it('should not return err for inserting on unknown type', function(done) {
      var id = uuid()
      var unknownType = 'unknownType'
      capre.insert(unknownType, id, function(err, data) {
        assert.ok(!err)
        assert.strictEqual(data.syndex, 1)
        capre.getSyndex(unknownType, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(syndex, 1)
          done()
        })
      })
    })
    it('should not return error if inserting many items', function(done) {
      // THIS IS A PROBLEM. Potential errors occur @
      // numbers > ulimit, but this really slows down
      // the test suite.
      var number = _.range(256)
      async.map(number, function(item, next) {
        var id = uuid()
        capre.insert(type, id, function(err) {
          next(err, id)
        })
      }, function(err, items) {
        done(err)
      })
    })
    describe('inserting multiple ids', function() {
      it('should be able to insert multiple ids at once', function(done) {
        var ids = []
        _.times(NUM_ITEMS, function() {
          ids.push(uuid())
        })
        capre.insert(type, ids, function(err, items) {
          assert.ok(!err, err)
          var itemIds = _.pluck(items, 'id')
          assert.ok(_.all(ids, function(id) {
            return _.include(itemIds, id)
          }))
          assert.equal(items.length, NUM_ITEMS)
          done()
        })
      })
      it('should err if any of the ids being inserted already exist', function(done) {
        insertMany(type, 1, function(err, insertedId) {
           var ids = []
          _.times(NUM_ITEMS, function() {
            ids.push(uuid())
          })
          ids.push(insertedId)
          capre.getSyndex(type, function(err, syndex) {
            assert.ok(!err, err)
            var syndexBefore = syndex
            capre.insert(type, ids, function(err, items) {
              assert.ok(err)
              assert.ok(/duplicate/.test(err.toString()))
              capre.getSyndex(type, function(err, syndexAfter) {
                assert.strictEqual(syndexBefore, syndexAfter)
                done()
              })
            })
          })
        })
      })
    })
  })
  describe('update', function() {
    var type = 'User'
    var id = uuid()
    beforeEach(function(done) {
      capre.register(type, function(err) {
        assert.ok(!err)
        capre.insert(type, id, function(err) {
          assert.ok(!err)
          done()
        })
      })
    })
    it('should error if not supplied a type', function(done) {
      capre.update(null, function(err) {
        assert.ok(err)
        assert.ok(/type/.test(err.toString()))
        done()
      })
    })

    it('should be able to update existing id', function(done) {
      capre.update(type, id, function(err, data) {
        assert.ok(!err, err)
        assert.strictEqual(data.syndex, 2)
        capre.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err, err)
          assert.strictEqual(syndex, 2)
          done()
        })
      })
    })
    it('should increase syndex each time', function(done) {
      // update bunch of items
      var update = function(i) {
        capre.update(type, id, function(err, data) {
          assert.ok(!err) 
          assert.ok(data)
          assert.strictEqual(data.syndex, i + 1)
          capre.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.strictEqual(syndex, data.syndex)
            if (i < NUM_ITEMS) { 
              update(++i)
            } else {
              done()
            }
          })
        })
      }
      update(1)
    })
    it('should return err for updating on unknown type', function(done) {
      var unknownType = 'unknownType'
      capre.update(unknownType, id, function(err) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.toString()))
        done()
      })
    })
    it('should return err for updating on unknown item', function(done) {
      var unknownId = 'unknownid'
      capre.update(type, unknownId, function(err) {
        assert.ok(err)
        assert.ok(/not found/.test(err.toString()))
        done()
      })
    })
  })
  describe('upsert', function() {
    var type = 'User'
    var id = uuid()
    beforeEach(function(done) {
      capre.register(type, function(err) {
        done(err)
      })
    })
    it('should error if not supplied a type', function(done) {
      capre.upsert(null, function(err) {
        assert.ok(err)
        assert.ok(/type/.test(err.toString()))
        done()
      })
    })
    it('should be able to upsert existing id', function(done) {
      capre.insert(type, id, function(err, item) {
        if (err) return done(err)
        capre.upsert(type, id, function(err, data) {
          assert.ok(!err)
          assert.strictEqual(data.syndex, 2)
          capre.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.strictEqual(syndex, 2)
            done()
          })
        })
      })
    })
    it('should be able to upsert a new object of type', function(done) {
      var id = uuid()
      capre.insert(type, id, function(err, item) {
        assert.ok(!err)
        capre.upsert(type, id, function(err, data) {
          assert.ok(!err)
          assert.strictEqual(data.syndex, 2) // remember, we inserted on in the beforeEach
          capre.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.strictEqual(syndex, 2)
            done()
          })
        })
      })
    })
    it('should increase syndex each upsert', function(done) {
      // purposely match i with increasing syndex
      var i = 0;
      var upsert = function(i) {
        var id = uuid()
        capre.upsert(type, id, function(err, data) {
          assert.ok(!err)
          assert.ok(data)
          assert.strictEqual(data.syndex, i + 1)
          capre.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.strictEqual(syndex, data.syndex)
            if (i < NUM_ITEMS) { 
              upsert(++i)
            } else {
              done()
            }
          })
        })
      }
      upsert(i)
    })
    it('will create type if unknown', function(done) {
      var id = uuid()
      var unknownType = 'unknownType'
      capre.upsert(unknownType, id, function(err, data) {
        assert.ok(!err)
        capre.getSyndex(unknownType, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(syndex, 1)
          done()
        })
      })
    })
    it('should not return err for upserting on unknown type', function(done) {
      var id = uuid()
      var unknownType = 'unknownType'
      capre.upsert(unknownType, id, function(err, data) {
        assert.ok(!err)
        assert.strictEqual(data.syndex, 1)
        capre.getSyndex(unknownType, id, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(syndex, 1)
          done()
        })
      })
    })
  })
  describe('sync', function(type, syndex) {
    var type = 'User'
    it('should error if not supplied a type', function(done) {
      capre.sync(null, function(err) {
        assert.ok(err)
        assert.ok(/type/.test(err.toString()))
        done()
      })
    })
    it('should get ids > supplied index', function(done) {
      var id1 = uuid()
      capre.insert(type, id1, function(err) {
        assert.ok(!err)
        var id2 = uuid()
        capre.insert(type, id2, function(err, data) {
          assert.ok(!err)
          var currentSyndex = data.syndex - 1
          // we want to grab just this most recent item
          capre.sync(type, currentSyndex, function(err, items, typeInfo) {
            assert.ok(!err)
            assert.equal(items.length, 1)
            assert.strictEqual(data.syndex, typeInfo.syndex)
            assert.equal(items[0], id2)
            done()
          })
        })
      })
    })
    it('shouldn\'t err for unknown types, just return no items', function(done) {
      var currentSyndex = 12
      var unknownType = 'unknownType'
      capre.sync(unknownType, currentSyndex, function(err, items, syndex) {
        assert.ok(!err)
        assert.equal(items.length, 0)
        done()
      })
    })
    describe('bulk', function() {
      beforeEach(function(done) {
        var count = 0
        for (var i = 0; i < NUM_ITEMS; i++) {
          var id = uuid()
          capre.insert(type, id, function(err, success) {
            assert.ok(!err)
            assert.ok(success)
            if (++count === NUM_ITEMS) {
              done()
            }
          })
        }
      })
      it('should get all ids > supplied index', function(done) {
        var currentSyndex = 12
        capre.sync(type, currentSyndex, function(err, items, syndex) {
          assert.ok(!err)
          assert.equal(items.length, NUM_ITEMS - currentSyndex)
          _.every(items, function(item) {
            return item.syndex > currentSyndex
          })
          done()
        })
      })
    })
  })
  describe('remove', function() {
    var type = 'User'
    var id
    beforeEach(function(done) {
      id = uuid()
      capre.insert(type, id, function(err, data) {
        assert.ok(!err)
        done()
      })
    })
    it('should error if not supplied a type', function(done) {
      capre.remove(null, function(err) {
        assert.ok(err)
        assert.ok(/type/.test(err.toString()))
        done()
      })
    })
    describe('should be able to remove an object of type', function() {
      var data
      beforeEach(function(done) {
        capre.remove(type, id, function(err, removeData) {
          assert.ok(!err)
          data = removeData
          done()
        })
      })
      describe('returned data', function() {
        it('should have syndex of two', function() {
          assert.strictEqual(data.syndex, 2)
        })
        it('should have supplied id', function() {
          assert.equal(data.id, id)
        })
        it('should be able to be gotten and still be \'removed\'', function(done) {
          capre.get(type, data.id, function(err, item) {
            assert.ok(!err)
            assert.equal(item.id, data.id)
            done()
          })
        })
      })
    })
    it('should return err for removing on unknown item', function(done) {
      var unknownId = 'unknownid'
      capre.remove(type, unknownId, function(err) {
        assert.ok(err)
        assert.ok(/not found/.test(err.toString()))
        done()
      })
    })
    it('should return err for removing on unknown type', function(done) {
      var unknownType = 'unknownType'
      capre.remove(unknownType, id, function(err) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.toString()))
        done()
      })
    })
  })
}

