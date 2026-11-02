const crypto = require('node:crypto')
const fs = require('node:fs')

// Lazy import() in barrels makes most files related to most tests; test files keep it, as some load their subject so
const LAZY_IMPORT_RE = /\bimport\s*\(/g
const TEST_FILE_RE = /\.test\.[cm]?[jt]sx?$/

module.exports = {
  extract(code, filePath, defaultExtract) {
    return defaultExtract(TEST_FILE_RE.test(filePath) ? code : code.replace(LAZY_IMPORT_RE, 'lazyImport('), filePath)
  },
  getCacheKey() {
    return crypto.createHash('sha1').update(fs.readFileSync(__filename)).digest('hex')
  },
}
