var util = require('util') // node util

exports.sanitize = function(content) {
  if ((!(content) && content !== 0) ||
      (typeof content === 'object' && !(content instanceof Date)) ||
      util.isArray(content))  {
    content = ''
  }
  if (content instanceof Date) {
    return String(content)
  }
  content = String(content)
  return content.toLowerCase().replace(/([^0-9a-z_\-\s])/g, '').replace(/[_\s]/g, '-').trim()
}
