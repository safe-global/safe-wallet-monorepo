const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const cheerio = require('cheerio')

const OUT_DIR = 'out'
const CHUNKS_DIR = path.join(OUT_DIR, '_next', 'static', 'chunks')
const MANIFEST_JS_FILENAME = 'chunks-sri-manifest.js'

/**
 * Recursively find all JS files in `out/_next/static/chunks`
 */
function getAllChunkFiles(dir = CHUNKS_DIR) {
  let results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results = results.concat(getAllChunkFiles(entryPath))
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(entryPath)
    }
  }
  return results
}

/**
 * Compute the SHA-384 SRI hash for a given file
 */
function computeSriHash(filePath) {
  const content = fs.readFileSync(filePath)
  const hash = crypto.createHash('sha384').update(content).digest('base64')
  return `sha384-${hash}`
}

/**
 * Build a mapping from each chunk's public path to its integrity hash
 * e.g.: { "/_next/static/chunks/foo.js": "sha384-abc..." }
 */
function buildSriManifest() {
  const allJsFiles = getAllChunkFiles(CHUNKS_DIR)
  const manifest = {}

  for (const filePath of allJsFiles) {
    // filePath is absolute, e.g. /path/to/out/_next/static/chunks/foo.js
    // We want to create a key like "/_next/static/chunks/foo.js"
    const relPath = path.relative(OUT_DIR, filePath).replace(/\\/g, '/')
    // On Windows, ensure forward slashes
    const publicPath = `/${relPath}`
    manifest[publicPath] = computeSriHash(filePath)
  }

  return manifest
}

/**
 * Write the manifest file in `out/_next/static/`.
 * The script sets the global window.__CHUNK_SRI_MANIFEST
 */
function writeExternalManifest(manifestObj) {
  const manifestJson = JSON.stringify(manifestObj, null, 2)

  const fileContents = `
/**
 * Auto-generated chunk SRI manifest.
 * DO NOT EDIT.
 */
window.__CHUNK_SRI_MANIFEST = ${manifestJson};
`
  const manifestJsPath = path.join(OUT_DIR, '_next', 'static', MANIFEST_JS_FILENAME)
  fs.writeFileSync(manifestJsPath, fileContents, 'utf8')

  return `/_next/static/${MANIFEST_JS_FILENAME}`
}

/**
 * Insert a single <script src="..."> reference into each .html file
 */
function insertManifestScriptIntoHtml(manifestScriptPath) {
  function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        processDir(entryPath)
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const html = fs.readFileSync(entryPath, 'utf8')
        const $ = cheerio.load(html)

        // Ideally, put it in <head> so it loads early
        // so the manifest is available by the time Next tries dynamic chunks
        const container = $('head').length ? $('head') : $('body')
        container.append(`\n<script src="${manifestScriptPath}"></script>\n`)

        fs.writeFileSync(entryPath, $.html(), 'utf8')
      }
    }
  }

  processDir(OUT_DIR)
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
      const integrityVal = computeSriHash(scriptFilePath)
      $(scriptEl).attr('integrity', integrityVal)

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

/**
 * Main
 */
function main() {
  const sriManifest = buildSriManifest()
  // 1) Write the external JS file
  const manifestScriptPublicPath = writeExternalManifest(sriManifest)
  // 2) Insert <script src="..."> references in each .html
  insertManifestScriptIntoHtml(manifestScriptPublicPath)
  // 3) Insert integrity hashes for all static html files
  addSRIToAllHtmlFiles(OUT_DIR)

  console.log(`Added SRI manifest script to all .html files.`)
}

main()
