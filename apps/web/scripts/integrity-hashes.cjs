const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const cheerio = require('cheerio')

const OUT_DIR = 'out'

/**
 * Given a local file path, compute the SHA-256 integrity hash.
 */
function generateIntegrityHash(filePath) {
  const fileContents = fs.readFileSync(filePath)
  const hash = crypto.createHash('sha256').update(fileContents).digest('base64')
  return `sha256-${hash}`
}

/**
 * Process a single .html file to add SRI attributes to local script tags.
 */
function processHtmlFile(htmlFilePath) {
  const html = fs.readFileSync(htmlFilePath, 'utf8')
  const $ = cheerio.load(html)

  $('script[src]').each((_, scriptEl) => {
    const scriptSrc = $(scriptEl).attr('src')
    /**
     * Skip external or protocol-based (http/https) scripts. Currently, no external scripts
     * are loaded but if that is the case we should fetch those scripts here e.g. via curl
     */
    if (!scriptSrc || scriptSrc.startsWith('http')) {
      console.log('Skipping external script', scriptSrc)
      return
    }

    // Build an absolute path to the script
    const scriptFilePath = path.join(path.dirname(htmlFilePath), scriptSrc)

    // Ensure the file actually exists before hashing
    if (fs.existsSync(scriptFilePath) && fs.lstatSync(scriptFilePath).isFile()) {
      const integrityVal = generateIntegrityHash(scriptFilePath)
      $(scriptEl).attr('integrity', integrityVal)
      $(scriptEl).attr('crossorigin', 'anonymous')

      console.log('Added integrity hash', integrityVal, scriptSrc)
    }
  })

  // Write the updated HTML back to disk
  fs.writeFileSync(htmlFilePath, $.html(), 'utf8')
}

/**
 * Recursively traverse a directory, processing .html files.
 */
function addSRIToAllHtmlFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      addSRIToAllHtmlFiles(entryPath)
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      processHtmlFile(entryPath)
    }
  }
}

addSRIToAllHtmlFiles(OUT_DIR)
