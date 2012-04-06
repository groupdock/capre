var assert = require('assert')
var util = require('../../lib/util')

describe('sanitize', function() {
  it('sanitizes input to a-z, 0-9 -_', function() {
    var s = util.sanitize
    assert.strictEqual(s('a dog'), 'a-dog')
    assert.strictEqual(s('b-dog'), 'b-dog')
    assert.strictEqual(s('c-Dog'), 'c-dog')
    assert.strictEqual(s('D_Dog'), 'd-dog')
    assert.strictEqual(s('1 Dog'), '1-dog')
    assert.strictEqual(s('2 Dog!@#$%^&*()'), '2-dog')
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


