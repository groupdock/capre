'use strict'

var _ = require('underscore')
var async = require('async')

var sinon = require('sinon')
var redis = require('redis')

var assert = require('assert')
var client = redis.createClient()
var uuid = require('shortid')
var MasterRedisAdaptor = require('../../../../lib/capre/adaptors/redis')

describe('redis adaptor', function() {
  var NUM_ITEMS = 20
  var type = 'User'
  before(function(done) {
    var client = redis.createClient()
    client.on('ready', function() {
      done()
    })
  })
  var redisAdaptor
  before(function(done) {
    redisAdaptor = new MasterRedisAdaptor(done)
    redisAdaptor._client = client
  })
  afterEach(function(done) {
    client.flushall(function() {
      done()
    })
  })

  function insertMany(type, num, callback) {
    var ids = []
    _.times(num, function() {
      ids.push(uuid())
    })
    redisAdaptor.getSyndex(type, function(err, syndex) {
      assert.ok(!err, err)
      var beforeSyndex = syndex
      async.forEach(ids, function(id, done) {
        redisAdaptor.mark(type, id, done)
      }, function(err) {
        assert.ok(!err, err)
        redisAdaptor.getSyndex(type, function(err, syndex) {
          assert.ok(!err, err)
          var afterSyndex = syndex
          assert.strictEqual(afterSyndex, beforeSyndex + num)
          assert.strictEqual(ids.length, num)
          callback(null, ids)
        })
      })
    })
  }

  describe('flush', function() {
    it('should clean db', function(done) {
      var stub = sinon.stub(client, 'flushdb')
      stub.callsArg(0)
      redisAdaptor.flush(function() {
        assert.ok(stub.called)
        done()
      })
    })
  })
  describe('getSyndex', function() {
    it('should get numeric syndex for a type', function(done) {
      redisAdaptor._mark(type, uuid(), function(err) {
        assert.ifError(err)
        redisAdaptor._mark(type, uuid(), function(err) {
        assert.ifError(err)
          redisAdaptor.getSyndex(type, function(err, syndex) {
            assert.ifError(err)
            assert.strictEqual(typeof syndex, 'number')
            assert.strictEqual(syndex, 2)
            done()
          })
        })
      })
    })

    it('should get 0 syndex for a type with no items', function(done) {
      redisAdaptor.getSyndex(type, function(err, syndex) {
        assert.ifError(err)
        assert.strictEqual(typeof syndex, 'number')
        assert.strictEqual(syndex, 0)
        done()
      })
    })
    
  })
  describe('mark', function() {
    it('should increase syndex', function(done) {
      var id = uuid()
      redisAdaptor._mark(type, id, function(err, item) {
        assert.ifError(err)
        id = uuid()
        redisAdaptor._mark(type, id, function(err, item) {
          assert.ifError(err)
          id = uuid()
          redisAdaptor._mark(type, id, function(err, item) {
            assert.ifError(err)
            redisAdaptor.getSyndex(type, function(err, syndex) {
              assert.ifError(err)
              assert.strictEqual(syndex, 3)
              done()
            })
          })
        })
      })
    })
    it('should increase syndex each insert', function(done) {
      // purposely match i with increasing syndex
      var i = 0;
      var insert = function(i) {
        var id = uuid()
        redisAdaptor.mark(type, id, function(err, itemSyndex) {
          assert.ifError(err)
          assert.strictEqual(itemSyndex, i + 1)
          redisAdaptor.getSyndex(type, function(err, syndex) {
            assert.ifError(err)
            assert.strictEqual(syndex, itemSyndex)
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
    describe('inserting multiple ids', function() {
      it('should be able to insert multiple ids at once', function(done) {
        var ids = []
        _.times(NUM_ITEMS, function() {
          ids.push(uuid())
        })
        redisAdaptor.mark(type, ids, function(err) {
          assert.ifError(err)
          redisAdaptor.getSyndex(type, function(err, syndex) {
            assert.ifError(err)
            assert.equal(syndex, NUM_ITEMS)
            done()
          })
        })
      })
    })
    describe('sync', function(type, syndex) {
      var type = 'User'
      it('should error if not supplied a type', function(done) {
        redisAdaptor.getAboveSyndex(null, function(err) {
          assert.ok(err)
          assert.ok(/type/.test(err.toString()))
          done()
        })
      })
      it('should get ids > supplied index', function(done) {
        var id1 = uuid()
        redisAdaptor.mark(type, id1, function(err) {
          assert.ok(!err)
          var id2 = uuid()
          redisAdaptor.mark(type, id2, function(err, syndex) {
            assert.ok(!err)
            var currentSyndex = syndex - 1
            // we want to grab just this most recent item
            redisAdaptor.getAboveSyndex(type, currentSyndex, function(err, items, typeSyndex) {
              assert.ok(!err)
              assert.equal(items.length, 1)
              assert.strictEqual(syndex, typeSyndex)
              assert.equal(items[0], id2)
              done()
            })
          })
        })
      })
      it('shouldn\'t err for unknown types, just return no items', function(done) {
        var currentSyndex = 12
        var unknownType = 'unknownType'
        redisAdaptor.getAboveSyndex(unknownType, currentSyndex, function(err, items, syndex) {
          assert.ok(!err)
          assert.equal(items.length, 0)
          assert.equal(syndex, 0)
          done()
        })
      })
      describe('bulk', function() {
        beforeEach(function(done) {
          var count = 0
          for (var i = 0; i < NUM_ITEMS; i++) {
            var id = uuid()
            redisAdaptor.mark(type, id, function(err, success) {
              assert.ok(!err)
              assert.ok(success)
              if (++count === NUM_ITEMS) {
                done()
              }
            })
          }
        })
        it('should get all ids > supplied index', function(done) {
          var currentSyndex = NUM_ITEMS / 2
          redisAdaptor.getAboveSyndex(type, currentSyndex, function(err, items, syndex) {
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
  })
})
