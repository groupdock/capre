'use strict'

var sinon = require('sinon')
var redis = require('redis')

var assert = require('assert')
var client = redis.createClient()

var MasterRedisAdaptor = require('../../../../lib/capre/adaptors/redis')

describe('redis adaptor', function() {
  before(function(done) {
    var client = redis.createClient()
    client.on('ready', function() {
      done()
    })
  })
  afterEach(function(done) {
    client.flushall(function() {
      done()
    })
  })
  describe('flush', function() {
    var redisAdaptor
    before(function(done) {
      redisAdaptor = new MasterRedisAdaptor(done)
      redisAdaptor._client = client
    })
    it('should clean db', function(done) {
      var stub = sinon.stub(client, 'flushdb')
      stub.callsArg(0)
      redisAdaptor.flush(function() {
        assert.ok(stub.called)
        done()
      })
    })
  })
})
