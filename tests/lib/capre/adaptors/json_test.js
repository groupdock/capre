var mkdirp = require('mkdirp')
var assert = require('assert')
var path = require('path')
var fs = require('fs')

var JSONAdaptor = require('../../../../lib/capre/adaptors/json')

describe('json adaptor', function() {
  var adaptor
  var filePath = 'tests/tmp/slave.json'
  var type = 'User'
  before(function(done) {
    if (!adaptor) return done()
    mkdirp(path.dirname(adaptor._path), done)
  })
  describe('saving and loading data', function() {
    var loadData = function() {
      var data = fs.readFileSync(adaptor._path, 'utf8')
      data = JSON.parse(data)
      return data
    }
    before(function(done) {
      adaptor = new JSONAdaptor(filePath, done)
    })
    after(function(done) {
      if (!(adaptor && adaptor._path)) return done()
      fs.unlink(adaptor._path, function(err) {
        // don't care about not found erros
        if (err && err.code != 'ENOENT') {
          done(err)
        } else {
          done()
        }
      })
    })
    it('saves a register', function(done) {
      adaptor.register(type, function(err) {
        assert.ok(!err)
        var data = loadData()
        assert.ok(data[type])
        done()
      })
    })
    it('saves a flush', function(done) {
      adaptor.register(type, function(err) {
        assert.ok(!err)
        adaptor.flush(function(err) {
          assert.ok(!err)
          adaptor = new JSONAdaptor(adaptor._path, function(err) {
            assert.ok(!err)
            adaptor.getTypes(function(err, types) {
              assert.ok(!err)
              assert.equal(types.length, 0)
              done()
            })
          })
        })
      })
    })
    it('can load data', function(done) {
      adaptor.register(type, function(err) {
        adaptor = new JSONAdaptor(adaptor._path, function(err) {
          assert.ok(!err)
          adaptor.getTypes(function(err, types) {
            assert.ok(!err)
            assert.equal(types.length, 1)
            assert.equal(types[0], type)
            done()
          })
        })
      })
    })
    it('sets default path', function(done) {
      adaptor = new JSONAdaptor(function(err) {
        assert.ok(!err)
        assert.ok(adaptor._path)
        assert.equal(path.normalize(adaptor._path), path.join(process.cwd(), 'slave.json'))
        done()
      })
    })
  })
})
