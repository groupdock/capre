var assert = require('assert')

var _ = require('underscore')
var MasterMemoryAdaptor = require('../../../../lib/master/adaptors/memory')

describe('memory adaptor', function() {
  var memoryAdaptor
  var type = 'User'
  describe('isRegistered', function() {

    beforeEach(function(done) {
      memoryAdaptor = new MasterMemoryAdaptor()
      memoryAdaptor.register(type, done)
    })
    it('gives true value for registered types', function(done) {
      memoryAdaptor.isRegistered(type, function(err, isRegistered) {
        assert.ok(!err)
        assert.ok(isRegistered)
        done()
      })
    })
    it('gives false value for unregistered types', function(done) {
      var unknownType = 'unknownType'
      memoryAdaptor.isRegistered(unknownType, function(err, isRegistered) {
        assert.ok(!err)
        assert.ok(!isRegistered)
        done()
      })
    })
  })
  describe('register', function() {
    it('can register types', function(done) {
      var newType = 'Stream'
      memoryAdaptor.register(newType, function(err, typeData) {
        assert.ok(!err)
        assert.ok(typeData)
        assert.equal(typeData.type, newType)
        assert.equal(typeData.syndex, 0)
        assert.equal(typeData.items.length, 0)

        memoryAdaptor.isRegistered(newType, function(err, isRegistered) {
          assert.ok(!err)
          assert.ok(isRegistered)
          done()
        })
      })
    })
    it('will simply give falsey value if it didn\'t register new type', function(done) {
      var newType = 'Stream'
      memoryAdaptor.register(type, function(err, typeData) {
        assert.ok(!err)
        assert.ok(!typeData)
        done()
      })
    })
  })
  describe('getTypes', function() {
    it('should be able to get registered types', function(done) {
      var userType = 'User'
      var streamType = 'Stream'
      memoryAdaptor.register(userType, function(err) {
        assert.ok(!err)
        memoryAdaptor.register(streamType, function(err) {
          assert.ok(!err)
          memoryAdaptor.getTypes(function(err, types) {
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
  describe('bumpSyndex', function() {
    it('should increase type syndex', function(done) {
      memoryAdaptor.register(type, function(err) {
        assert.ok(!err)
        memoryAdaptor.bumpSyndex(type, function(err, syndex) {
          assert.ok(!err)
          assert.equal(1, syndex)
          memoryAdaptor.bumpSyndex(type, function(err, syndex) {
            assert.ok(!err)
            assert.equal(2, syndex)
            done()
          })
        })
      })
    })
    it('will return null for non-existing types', function(done) {
      var unknownType = 'unknownType'
      memoryAdaptor.bumpSyndex(unknownType, function(err, syndex) {
        assert.ok(!err)
        assert.strictEqual(null, syndex)
        memoryAdaptor.bumpSyndex(unknownType, function(err, syndex) {
          assert.ok(!err)
          assert.strictEqual(null, syndex)
          done()
        })
      })
    })
  })
})
