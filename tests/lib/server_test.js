'use strict'

var assert = require('assert')

var uuid = require('shortid')
var restify = require('restify')

var capre = require('../../')
var Server = require('../../lib/server')

var helpers = require('../helpers')


describe('server', function() {
  var client, master
  var server
  var type = 'User'
  var name = 'Some_App'
  var NUM_ITEMS = 30
  var generateItems
  var generatedItems
  var PORT = 5001

  before(function() {
    client = restify.createJsonClient({
      url: 'http://localhost:' + PORT,
      version: '*'
    })
    master = capre.createMaster()
    generateItems = helpers.generateItems(master)
  })
  before(function() {
    server = Server.createServer()
    server.listen(PORT)
  })
  beforeEach(function(done) {
    master.flush(done)
  })
  describe('get sync/:name/:type', function() {
    beforeEach(function(done) {
      generateItems(type, NUM_ITEMS, function(err, items) {
        assert.ifError(err)
        generatedItems = items
        done()
      })
    })
    it('syncs', function(done) {
      client.get('/sync/'+ name +'/'+ type, function(err, req, res, body) {
        assert.ifError(err)
        assert.deepEqual(body.items, generatedItems)
        assert.strictEqual(body.syndex, NUM_ITEMS)
        done()
      })
    })
    it('requires type', function(done) {
      client.get('/sync/'+ name, function(err, req, res, body) {
        assert.ok(err)
        done()
      })
    })
    it('requires name', function(done) {
      client.get('/sync/', function(err, req, res, body) {
        assert.ok(err)
        done()
      })
    })
  })
  describe('post /mark', function() {
    it('marks an item', function(done) {
      var id = uuid()
      client.post('/mark', {type: type, id: id}, function(err, req, res, body) {
        assert.ifError(err)
        assert.deepEqual(body, {syndex: 1})
        master.getAboveSyndex(type, 0, function(err, items, syndex) {
          assert.ifError(err)
          assert.deepEqual([id], items)
          done()
        })
      })
    })
    describe('mark many', function() {
      var ids
      beforeEach(function(done) {
        generateItems(type, NUM_ITEMS, false, function(err, items) {
          assert.ifError(err)
          ids = items
          done()
        })
      })

      it('marks many items', function(done) {
        client.post('/mark', {type: type, ids: ids}, function(err, req, res, body) {
          assert.ifError(err)
          assert.deepEqual(body, {syndex: NUM_ITEMS})
          master.getAboveSyndex(type, 0, function(err, items, syndex) {
            assert.ifError(err)
            assert.deepEqual(ids, items)
            assert.strictEqual(syndex, NUM_ITEMS)
            done()
          })
        })
      })
    })

    it('requires type', function(done) {
      client.post('/mark', {id: uuid()}, function(err, req, res, body) {
        assert.ok(err)
        done()
      })
    })
    it('requires id', function(done) {
      client.post('/mark', {type: type}, function(err, req, res, body) {
        assert.ok(err)
        done()
      })
    })
  })
})
