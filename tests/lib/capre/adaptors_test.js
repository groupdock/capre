var _ = require('underscore')
var assert = require('assert')
var uuid = require('node-uuid')

var sinon = require('sinon')

var Capre = require('../../../lib/capre/')
var CapreRedisAdaptor = require('../../../lib/capre/adaptors/redis')
var CapreMemoryAdaptor = require('../../../lib/capre/adaptors/memory')
var redis = require("redis")


exports.shouldBehaveLikeACapreAdaptor = function(){
  var capre, backend
  var NUM_ITEMS = 20

  before(function(done) {
    var backend = new this.backend(function() {
      capre = new Capre(backend, done)
    })
  })
  beforeEach(function(done) {
    capre.flush(done)
  })
  after(function(done) {
    capre.flush(done)
  })
  describe('flush', function() {
    it('will flush types', function(done) {
      var type = 'SomeType'
      capre.register(type, function(err, typeData) {
        assert.ok(!err)
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
        assert.equal(typeData.syndex, 0)
        capre.getTypes(function(err, types) {
          assert.ok(!err)
          assert.ok(types)
          assert.equal(types.length, 1)
          assert.equal(types[0], type)
        })
        done()
      })
    })
    it('will error if registering already registered type', function(done) {
      var type = 'SomeType'
      capre.register(type, function(err, syndex) {
        capre.register(type, function(err, syndex) {
          assert.ok(err)
          assert.ok(/exists/.test(err.message))
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
        assert.equal(typeData.syndex, 0)
        capre.getTypes(function(err, types) {
          assert.ok(!err)
          assert.ok(types)
          assert.equal(types.length, 1)
          assert.equal(types[0], type)
          done()
        })
      })
    })
    it('won\'t error if registering already registered type', function(done) {
      capre.register(type, function(err, syndex) {
        capre._registerIfMissing(type, function(err, typeInfo) {
          assert.ok(!err)
          assert.ok(typeInfo)
          assert.equal(typeInfo.syndex, 0)
          done()
        })
      })
    })
    it('will not reset existing type', function(done) {
      capre.register(type, function(err) {
        assert.ok(!err)
        capre.bumpSyndex(type, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          capre._registerIfMissing(type, function(err, typeInfo) {
            assert.ok(!err)
            assert.equal(typeInfo.syndex, 1)
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
    it('should be able to get syndex for a type', function(done) {
      capre.getSyndex(type, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 0)
        done()
      })
    })
    it('should error if getting syndex of unknown type', function(done) {
      var unknownType = 'unknownType'
      capre.getSyndex(unknownType, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
        done()
      })
    })
    it('should be able to get syndex for an id', function(done) {
      var id = uuid()
      capre.insert(type, id, function(err) {
        assert.ok(!err)
        capre.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          done()
        })
      })
    })
    it('should return null for getting syndex of unknown id', function(done) {
      var nonExistingID = uuid()
      capre.getSyndex(type, nonExistingID, function(err, syndex) {
        assert.ok(!err)
        assert.strictEqual(syndex, null)
        done()
      })
    })
    it('should return err for getting syndex of unknown type', function(done) {
      var nonExistingID = uuid()
      var unknownType = 'unknownType'
      capre.getSyndex(unknownType, nonExistingID, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
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
          assert.equal(data.syndex, 1)
          done()
        })
      })
    })
  })
  describe('find', function() {
    var type = 'User'
    it('can find things', function(done) {
      capre.register(type, function(err) {
        var id = uuid()
        capre.insert(type, id, function(err) {
          capre.find(type, id, function(err, found) {
            assert.ok(!err)
            assert.ok(found)
            assert.ok(found.id)
            done()
          })
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
        assert.equal(syndex, 1)
        capre.bumpSyndex(type, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 2)
          capre.getSyndex(type, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, 2)
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
          assert.equal(syndex, 1)
          capre.bumpSyndex(anotherType, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, 1)
            done()
          })
        })
      })
    })
    it('produces error if the type is unknown', function(done) {
      var unknownType = 'unknownType'
      capre.bumpSyndex(unknownType, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
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
          assert.equal(data.syndex, 1)
        })
        it('should have supplied id', function() {
          assert.equal(data.id, id)
        })
      })
      it('added to capre list', function(done) {
        capre.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          done()
        })
      })
    })
    it('should increase syndex', function(done) {
      var bumped = sinon.spy(capre, 'bumpSyndex')
      var id = uuid()
      capre.insert(type, id, function(err, item) {
        assert.ok(!err)
        id = uuid()
        capre.insert(type, id, function(err, item) {
          assert.ok(!err)
          id = uuid()
          capre.insert(type, id, function(err, item) {
            assert.ok(!err)
            assert.ok(bumped.calledThrice)
            assert.ok(bumped.alwaysCalledWith(type))
            assert.ok(item)
            assert.equal(item.syndex, 3)
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
          assert.equal(data.syndex, i + 1)
          capre.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, data.syndex)
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
          assert.ok(/duplicate/.test(err.message))
          capre.getSyndex(type, id, function(err, syndex) {
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
      capre.insert(unknownType, id, function(err, data) {
        assert.ok(!err)
        assert.equal(data.syndex, 1)
        capre.getSyndex(unknownType, id, function(err, syndex) {
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
        assert.ok(/type/.test(err.message))
        done()
      })
    })

    it('should be able to update existing id', function(done) {
      capre.update(type, id, function(err, data) {
        assert.ok(!err)
        assert.equal(data.syndex, 2)
        capre.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 2)
          done()
        })
      })
    })
    it('should increase syndex each time', function(done) {
      // purposely match i with increasing syndex
      var count = 0;
      for (var i = 1; i <= NUM_ITEMS; i++) {
        // because of async, need to fix value of i to function scope
        var insert = function(i) {
          capre.update(type, id, function(err, data) {
            assert.ok(!err)
            assert.equal(data.syndex, i + 1) // syndex 1 will be taken by initial insert
            if (count++ === NUM_ITEMS - 1) done()
          })
        }
        insert(i)
      }
    })
    it('should return err for updating on unknown type', function(done) {
      var unknownType = 'unknownType'
      capre.update(unknownType, id, function(err) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
        done()
      })
    })
    it('should return err for updating on unknown item', function(done) {
      var unknownId = 'unknownid'
      capre.update(type, unknownId, function(err) {
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
      capre.register(type, function(err) {
        done(err)
      })
    })
    it('should error if not supplied a type', function(done) {
      capre.upsert(null, function(err) {
        assert.ok(err)
        assert.ok(/type/.test(err.message))
        done()
      })
    })
    it('should be able to upsert existing id', function(done) {
      capre.insert(type, id, function(err, item) {
        if (err) return done(err)
        capre.upsert(type, id, function(err, data) {
          assert.ok(!err)
          assert.equal(data.syndex, 2)
          capre.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, 2)
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
          assert.equal(data.syndex, 2) // remember, we inserted on in the beforeEach
          capre.getSyndex(type, id, function(err, syndex) {
            assert.ok(!err)
            assert.equal(syndex, 2)
            done()
          })
        })
      })
    })
    it('should increase syndex each upsert', function(done) {
      // purposely match i with increasing syndex
      var count = 0;
      for (var i = 0; i < NUM_ITEMS; i++) {
        // because of async, need to fix value of i to function scope
        var insert = function(i) {
          capre.upsert(type, id, function(err, data) {
            assert.ok(!err)
            assert.equal(data.syndex, i + 1) // syndex 1 will be taken by initial insert
            if (i === NUM_ITEMS - 1) done()
          })
        }
        insert(i)
      }
    })
    it('will create type if unknown', function(done) {
      var id = uuid()
      var unknownType = 'unknownType'
      capre.upsert(unknownType, id, function(err, data) {
        assert.ok(!err)
        capre.getSyndex(unknownType, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          done()
        })
      })
    })
    it('should not return err for upserting on unknown type', function(done) {
      var id = uuid()
      var unknownType = 'unknownType'
      capre.upsert(unknownType, id, function(err, data) {
        assert.ok(!err)
        assert.equal(data.syndex, 1)
        capre.getSyndex(unknownType, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
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
        assert.ok(/type/.test(err.message))
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
            assert.equal(data.syndex, typeInfo.syndex)
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
        assert.ok(/type/.test(err.message))
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
          assert.equal(data.syndex, 2)
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
        assert.ok(/not found/.test(err.message))
        done()
      })
    })
    it('should return err for removing on unknown type', function(done) {
      var unknownType = 'unknownType'
      capre.remove(unknownType, id, function(err) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
        done()
      })
    })
  })
}

