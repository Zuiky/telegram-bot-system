function generateCode(type) {
  return type.slice(0,3).toUpperCase() +
    Math.random().toString(36).substring(2,7).toUpperCase()
}

module.exports = { generateCode }
