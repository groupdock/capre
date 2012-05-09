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
  return content.replace(/([^0-9a-zA-Z_\-\s])/g, '').trim()
}