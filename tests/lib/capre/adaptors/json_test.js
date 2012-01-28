var mkdirp = require('mkdirp')
var assert = require('assert')
var path = require('path')
var fs = require('fs')

var JSONAdaptor = require('../../../../lib/capre/adaptors/json')

describe('json adaptor', function() {
  var adaptor, PATH
  var type = 'User'
  var PATH = 'tests/tmp/slave.json'
  before(function(done) {
    mkdirp(path.dirname(PATH), done)
  })
  describe('saving and loading data', function() {
    var loadData = function() {
      var data = fs.readFileSync(PATH, 'utf-8')
      data = JSON.parse(data)
      return data
    }
    before(function(done) {
      adaptor = new JSONAdaptor(PATH, done)
    })
    after(function(done) {
      if (!adaptor._path || !path.existsSync(adaptor._path)) return done()
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
    it('saves a flush', function() {
      
    })
    it('can load data', function(done) {
      adaptor = new JSONAdaptor(PATH, function(err) {
        assert.ok(!err)
        adaptor.getTypes(function(err, types) {
          assert.ok(!err)
          assert.equal(types.length, 1)
          assert.equal(types[0], type)
          done()
        })
      })
    })
    it('sets default path', function(done) {
      adaptor = new JSONAdaptor(function(err) {
        assert.ok(!err)
        assert.ok(adaptor._path)
        assert.equal(path.normalize(adaptor._path), path.join(process.cwd(), 'slave.json'))
        PATH = adaptor._path
        done()
      })
    })
  })
})
