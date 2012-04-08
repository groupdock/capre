var assert = require('assert')
var util = require('../../lib/util')

describe('sanitize', function() {
  it('sanitizes input to a-z, 0-9 -_', function() {
    var s = util.sanitize
    assert.strictEqual(s('2 D!@o#$%g^&*()'), '2 Dog')
  })
  it('handles strange values', function() {
    var s = util.sanitize
    assert.strictEqual(s(null), '')
    assert.strictEqual(s(undefined), '')
    assert.strictEqual(s(false), '')
    assert.strictEqual(s({}), '')
    assert.strictEqual(s({some: 'thing'}), '')
    assert.strictEqual(s([1, 2, 3]), '')
    var date = new Date()
    assert.strictEqual(s(date), String(date))
  })
})


