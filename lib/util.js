var util = require('util')

// convert item to alphanumeric with hyphens and underscores
exports.sanitize = function(content) {
  if (content && typeof content === 'object' && Object.prototype.toString !== content.toString 
      && !util.isArray(content) && !(content instanceof Date)) {
    content = content.toString()
  }
  if ((!(content) && content !== 0) ||
      (typeof content === 'object' &&
       !(content instanceof Date)) ||
      util.isArray(content)) {
    content = ''
  }

  if (content instanceof Date) {
    return String(content)
  }
  content = String(content)
  return content.replace(/([^0-9a-zA-Z_\-:\s])/g, '').trim()
}
