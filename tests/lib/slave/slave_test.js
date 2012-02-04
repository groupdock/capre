var assert = require('assert')

var Master = require('../../../lib/master')
var Slave = require('../../../lib/slave')
var uuid = require('node-uuid')
var async = require('async')
var _ = require('underscore')

function generateItems(master, type, count, callback) {
  master._registerIfMissing(type, function(err) {
    if (err) return callback(err)
    var number = _.range(count)
    async.mapSeries(number, function(item, next) {
      var id = uuid()
      master.insert(type, id, function(err) {
        next(err, id)
      })
    }, function(err, items) {

      callback(err, items)
    })
  })
}

describe('slave', function() {
  var PORT = 5000
  var NUM_ITEMS = 30
  var master, slave

  before(function(done) {
    master = new Master('memory').listen(PORT, done)
  })
  beforeEach(function(done) {
    async.parallel([
      function(next) {
        if (!master) return next()
        master.flush(next)
      },
      function(next) {
        if (!slave) return next()
        slave.flush(next)
      }
    ], done)
  })
  afterEach(function(done) {
    async.parallel([
      function(next) {
        if (!master) return next()
        master.flush(next)
      },
      function(next) {
        if (!slave) return next()
        slave.flush(function() {
          // ignore errors
          next()
        })
      }
    ], done)
  })
  describe('init', function() {
    it('should emit init when backend is ready', function(done) {
      var slave = new Slave('memory')
      slave.on('init', function() {
        assert.ok(slave)
        assert.ok(slave.backend)
        assert.ok(slave.capre)
        assert.ok(slave.initialised)
        done()
      })
    })
  })
  describe('flush', function() {
    it('should error if flushing before setup', function(done) {
      var slave2 = new Slave()
      slave2.flush(function(err) {
        assert.ok(err)
        done()
      })
    })
    describe('flush', function() {
      var type = 'User'
      var slave = new Slave('json')
      before(function(done) {
        slave.connect(PORT, function(err) {
          slave.setSyndex(type, 3, function() {
            slave.shutdown(done)
          })
        })
      })
      after(function(done) {
        slave.flush(function() {
          slave.shutdown(done)
        })
      })
      it('should allow flushing after setup', function(done) {
        slave.connect(PORT, function(err) {
          assert.ok(!err)
          slave.flush(function(err) {
            assert.ok(!err)
            slave.capre.getSyndex(type, function(err) {
              assert.ok(err)
              assert.ok(/unknown/.test(err.message))
              done()
            })
          })
        })
      })
    })
  })
  describe('connection', function() {
    afterEach(function(done) {
      if (slave) slave.shutdown(done)
    })
    it('can connect to master', function(done) {
      slave = new Slave().connect(PORT, function(err) {
        assert.ok(!err)
        done()
      })
    })
  })
  describe('sync', function() {
    var type = 'User'
    before(function(done) {
      slave = new Slave().connect(PORT, function() {
        slave.flush(done)
      })
    })
    it('will return error if not supplied a type', function(done) {
      slave.sync(function(err) {
        assert.ok(err)
        assert.ok(/required/.test(err.toString()))
        done()
      })
    })
    it('can sync with empty server', function(done) {
      slave.sync(type, function(err, ids) {
        assert.ok(!err)
        assert.ok(ids)
        assert.equal(ids.length, 0)
        done()
      })
    })
    describe('populated server', function() {
      beforeEach(function(done) {
        master.flush(function() {
          slave.flush(done)
        })
      })

      it('can sync with populated server', function(done) {
        master.register(type, function() {
          master.insert(type, uuid(), function() {
            slave.sync(type, function(err, ids, syndex) {
              assert.ok(!err)
              assert.ok(ids)
              assert.equal(ids.length, 1)
              assert.equal(syndex, 1)
              done()
            })
          })
        })
      })
      it('can sync multiple items from start', function(done) {
        generateItems(master, type, NUM_ITEMS, function(err, generatedItems) {
          assert.ok(!err)
          slave.sync(type, function(err, items, syndex) {
            assert.ok(!err)
            assert.equal(items.length, NUM_ITEMS)
            assert.equal(syndex, NUM_ITEMS)
            assert.equal(items.length, NUM_ITEMS)
            assert.equal(_.difference(items, generatedItems).length, 0)
            done()
          })
        })
      })
      it('can sync multiple times after master updated', function(done) {
        generateItems(master, type, NUM_ITEMS, function(err) {
          assert.ok(!err)
          slave.sync(type, function(err, items, syndex) {
            assert.ok(!err)
            assert.equal(syndex, NUM_ITEMS)
            assert.equal(items.length, NUM_ITEMS)
            generateItems(master, type, NUM_ITEMS, function(err) {
              assert.ok(!err)
              slave.sync(type, function(err, items, syndex) {
                assert.equal(syndex, NUM_ITEMS * 2)
                assert.equal(items.length, NUM_ITEMS)
                done()
              })
            })
          })
        })
      })
      describe('setSyndex', function() {
        it('will only sync items higher than setSyndex', function(done) {
          generateItems(master, type, NUM_ITEMS, function(err) {
            assert.ok(!err)
            slave.setSyndex(type, NUM_ITEMS / 2, function(err) {
              assert.ok(!err)
              slave.sync(type, function(err, items, syndex) {
                assert.ok(!err)
                assert.equal(syndex, NUM_ITEMS)
                assert.equal(items.length, NUM_ITEMS / 2)
                done()
              })
            })
          })
        })
      })
    })
  })
})
