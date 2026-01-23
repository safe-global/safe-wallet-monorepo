const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const cheerio = require('cheerio')

const OUT_DIR = 'out'
const CHUNKS_DIR = path.join(OUT_DIR, '_next', 'static', 'chunks')
const MANIFEST_JS_FILENAME = 'chunks-sri-manifest.js'

/**
 * Patch webpack runtime to inject SRI lookup for dynamically loaded chunks.
 *
 * Webpack's chunk loader (`__webpack_require__.l`) creates script tags for dynamic imports.
 * This function patches the minified webpack runtime to add integrity attributes
 * by looking up hashes from `window.__CHUNK_SRI_MANIFEST`.
 *
 * Must run BEFORE buildSriManifest() so the patched webpack file gets hashed correctly.
 */
function patchWebpackRuntime() {
  const entries = fs.readdirSync(CHUNKS_DIR, { withFileTypes: true })
  const webpackFiles = entries
    .filter((entry) => entry.isFile() && entry.name.startsWith('webpack-') && entry.name.endsWith('.js'))
    .map((entry) => path.join(CHUNKS_DIR, entry.name))

  if (webpackFiles.length === 0) {
    console.warn('Warning: No webpack-*.js files found in', CHUNKS_DIR)
    return
  }

  for (const filePath of webpackFiles) {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content

    // Pattern: varName.src = webpackObj.tu(urlVar)
    // This is webpack's __webpack_require__.l function setting script.src
    // We inject SRI lookup right after the src is set
    //
    // Matches patterns like:
    //   r.src=c.tu(d)
    //   a.src=o.tu(e)
    //
    // Transforms to:
    //   r.src=c.tu(d);var _sri=window.__CHUNK_SRI_MANIFEST||{};if(_sri[d])r.integrity=_sri[d]
    content = content.replace(
      /(\w)\.src=(\w)\.tu\((\w)\)/g,
      '$1.src=$2.tu($3);var _sri=window.__CHUNK_SRI_MANIFEST||{};if(_sri[$3])$1.integrity=_sri[$3]',
    )

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log('Patched webpack runtime for SRI:', path.basename(filePath))
    } else {
      console.warn('Warning: Could not find webpack chunk loader pattern in', path.basename(filePath))
    }
  }
}

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
  // 1) Patch webpack runtime to inject SRI lookup for dynamic imports
  //    Must run BEFORE buildSriManifest() so patched file gets correct hash
  patchWebpackRuntime()

  // 2) Build SRI manifest (hashes all chunk files including patched webpack)
  const sriManifest = buildSriManifest()

  // 3) Write the external manifest JS file
  const manifestScriptPublicPath = writeExternalManifest(sriManifest)

  // 4) Insert <script src="..."> references in each .html
  insertManifestScriptIntoHtml(manifestScriptPublicPath)

  // 5) Insert integrity hashes for all static script tags in html files
  addSRIToAllHtmlFiles(OUT_DIR)

  console.log(`SRI processing complete: patched webpack runtime, added manifest to all .html files.`)
}

main()
