'use strict'

var _ = require('underscore')
var async = require('async')

var sinon = require('sinon')
var redis = require('redis')
var uuid = require('shortid')
var assert = require('assert')

var Master = require('../../lib/master')
var sanitize = require('../../lib/util').sanitize

var helpers = require('../helpers')
describe('master', function() {
  var NUM_ITEMS = 30
  var type = 'User'
  var client
  var master
  before(function() {
    client = redis.createClient()
    master = new Master(client)
  })
  afterEach(function(done) {
    client.flushall(done)
  })

  var insertMany = helpers.generateItems(master)

  describe('flush', function() {
    it('should clean db', function(done) {
      var stub = sinon.stub(client, 'flushdb')
      stub.callsArg(0)
      master.flush(function() {
        assert.ok(stub.called)
        done()
      })
    })
  })
  describe('getSyndex', function() {
    it('should get numeric syndex for a type', function(done) {
      master.mark(type, uuid(), function(err) {
        assert.ifError(err)
        master.mark(type, uuid(), function(err) {
        assert.ifError(err)
          master.getSyndex(type, function(err, syndex) {
            assert.ifError(err)
            assert.strictEqual(typeof syndex, 'number')
            assert.strictEqual(syndex, 2)
            done()
          })
        })
      })
    })
    it('sanitizes type', function(done) {
      master.mark(type, uuid(), function(err, item) {
        assert.ifError(err)
        master.getSyndex(sanitize(type), function(err, syndex) {
          assert.ifError(err)
          assert.strictEqual(syndex, 1)
          done()
        })
      })
    })
    it('should get 0 syndex for a type with no items', function(done) {
      master.getSyndex(type, function(err, syndex) {
        assert.ifError(err)
        assert.strictEqual(typeof syndex, 'number')
        assert.strictEqual(syndex, 0)
        done()
      })
    })
  })
  describe('mark', function() {
    describe('requires a type', function() {
      it('undefined type', function(done){
        master.mark(undefined, uuid(), function(err, item) {
          assert.ok(err)
          assert.ok(/type is required/.test(err.message))
          done()
        })
      })
    })
    describe('requires an id', function() {
      it('undefined id', function(done){
        master.mark(type, undefined, function(err, item) {
          assert.ok(err)
          assert.ok(/id is required/.test(err.message))
          done()
        })
      })
      it('empty array id', function(done){
        master.mark(type, [], function(err, item) {
          assert.ok(err)
          assert.ok(/id is required/.test(err.message))
          done()
        })
      })
      it('empty string id', function(done){
        master.mark(type, '', function(err, item) {
          assert.ok(err)
          assert.ok(/id is required/.test(err.message))
          done()
        })
      })
      it('false id', function(done){
        master.mark(type, false, function(err, item) {
          assert.ok(err)
          assert.ok(/id is required/.test(err.message))
          done()
        })
      })
      it('object id', function(done){
        master.mark(type, {}, function(err, item) {
          assert.ok(err)
          assert.ok(/id is required/.test(err.message))
          done()
        })
      })
      it('function id', function(done){
        master.mark(type, function() {}, function(err, item) {
          assert.ok(err)
          assert.ok(/id is required/.test(err.message))
          done()
        })
      })
    })
    it('should increase syndex', function(done) {
      master.mark(type, uuid(), function(err) {
        assert.ifError(err)
        master.mark(type, uuid(), function(err) {
          assert.ifError(err)
          master.mark(type, uuid(), function(err, syndex) {
            assert.ifError(err)
            assert.strictEqual(syndex, 3)
            master.getSyndex(type, function(err, syndex) {
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
        master.mark(type, id, function(err, itemSyndex) {
          assert.ifError(err)
          assert.strictEqual(itemSyndex, i + 1)
          master.getSyndex(type, function(err, syndex) {
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
    it('should emit "mark" after marking an item', function(done) {
      var item = uuid()
      master.once('mark', function(markedType, markedItem) {
        assert.strictEqual(type, markedType)
        assert.equal(item, markedItem)
        done()
      })

      master.mark(type, item, function(err) {
        assert.ifError(err)
      })
    })
    it('should emit "mark:type" after marking an item', function(done) {
      var item = uuid()
      master.once('mark:'+ type, function(markedType, markedItem) {
        assert.strictEqual(type, markedType)
        assert.equal(item, markedItem)
        done()
      })

      master.mark(type, item, function(err) {
        assert.ifError(err)
      })
    })
    describe('inserting multiple ids', function() {
      it('should be able to insert multiple ids at once', function(done) {
        var ids = []
        _.times(NUM_ITEMS, function() {
          ids.push(uuid())
        })
        master.mark(type, ids, function(err) {
          assert.ifError(err)
          master.getSyndex(type, function(err, syndex) {
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
        master.getAboveSyndex(null, function(err) {
          assert.ok(err)
          assert.ok(/type/.test(err.toString()))
          done()
        })
      })
      it('should get ids > supplied index', function(done) {
        var id1 = uuid()
        master.mark(type, id1, function(err) {
          assert.ifError(err)
          var id2 = uuid()
          master.mark(type, id2, function(err, syndex) {
            assert.ifError(err)
            var currentSyndex = syndex - 1
            // we want to grab just this most recent item
            master.getAboveSyndex(type, currentSyndex, function(err, items, typeSyndex) {
              assert.ifError(err)
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
        master.getAboveSyndex(unknownType, currentSyndex, function(err, items, syndex) {
          assert.ifError(err)
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
            master.mark(type, id, function(err, success) {
              assert.ifError(err)
              assert.ok(success)
              if (++count === NUM_ITEMS) {
                done()
              }
            })
          }
        })
        it('should get all ids > supplied index', function(done) {
          var currentSyndex = NUM_ITEMS / 2
          master.getAboveSyndex(type, currentSyndex, function(err, items, syndex) {
            assert.ifError(err)
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
