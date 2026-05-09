const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const cheerio = require('cheerio')

const OUT_DIR = 'out'
const MANIFEST_JS_FILENAME = 'chunks-sri-manifest.js'
const CHUNKS_DIR = path.join(OUT_DIR, '_next/static/chunks')

/**
 * Compute the SHA-384 SRI hash for a given file
 */
function computeSriHash(filePath) {
  const content = fs.readFileSync(filePath)
  const hash = crypto.createHash('sha384').update(content).digest('base64')
  return `sha384-${hash}`
}

/**
 * Process a single .html file: inject manifest script tag and add SRI to static scripts.
 * Single-pass optimization: both operations done in one HTML parse/write cycle.
 *
 * @param {string} htmlFilePath - Path to the HTML file
 * @param {string} manifestScriptPath - Public path to the SRI manifest script
 */
function processHtmlFile(htmlFilePath, manifestScriptPath) {
  const html = fs.readFileSync(htmlFilePath, 'utf8')
  const $ = cheerio.load(html)

  // 1. Inject manifest script tag in <head> (so it loads early)
  const container = $('head').length ? $('head') : $('body')
  container.append(`\n<script src="${manifestScriptPath}"></script>\n`)

  // 2. Add SRI integrity attributes to all local script tags
  let processedCount = 0
  $('script[src]').each((_, scriptEl) => {
    const scriptSrc = $(scriptEl).attr('src')

    // Skip external scripts (http/https) - they need separate handling
    if (!scriptSrc || scriptSrc.startsWith('http')) {
      return
    }

    // Build absolute path to the script file
    const scriptFilePath = path.join(path.dirname(htmlFilePath), scriptSrc)

    // Compute and add integrity hash if file exists
    try {
      // Combined existence and type check (more efficient than separate calls)
      const stats = fs.statSync(scriptFilePath)
      if (stats.isFile()) {
        const integrityVal = computeSriHash(scriptFilePath)
        $(scriptEl).attr('integrity', integrityVal)
        processedCount++
      }
    } catch (err) {
      // File doesn't exist or is inaccessible - skip it
      if (err.code !== 'ENOENT') {
        console.warn(`Warning: Could not process ${scriptFilePath}: ${err.message}`)
      }
    }
  })

  // Write updated HTML back to disk (single write operation)
  fs.writeFileSync(htmlFilePath, $.html(), 'utf8')

  return processedCount
}

/**
 * Recursively traverse a directory, processing all .html files.
 *
 * @param {string} dirPath - Directory to process
 * @param {string} manifestScriptPath - Public path to the SRI manifest script
 * @returns {number} Total number of scripts processed
 */
function processAllHtmlFiles(dirPath, manifestScriptPath) {
  let totalProcessed = 0
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      totalProcessed += processAllHtmlFiles(entryPath, manifestScriptPath)
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      totalProcessed += processHtmlFile(entryPath, manifestScriptPath)
    }
  }

  return totalProcessed
}

/**
 * Generate chunk SRI manifest from actual files on disk
 * This runs AFTER Next.js export to ensure hashes match the final files
 */
function generateChunkManifest() {
  const manifest = {}

  // Recursively find all JS files in the chunks directory
  function findJsFiles(dir) {
    const files = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...findJsFiles(fullPath))
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(fullPath)
      }
    }
    return files
  }

  const jsFiles = findJsFiles(CHUNKS_DIR)

  for (const filePath of jsFiles) {
    // Compute hash from actual file content
    const hash = computeSriHash(filePath)

    // Convert file path to public URL
    // e.g., "out/_next/static/chunks/foo.js" -> "/_next/static/chunks/foo.js"
    const relativePath = path.relative(OUT_DIR, filePath)
    const publicPath = '/' + relativePath.replace(/\\/g, '/')

    manifest[publicPath] = hash
  }

  return manifest
}

/**
 * Write chunk SRI manifest to disk
 */
function writeChunkManifest(manifest) {
  const manifestPath = path.join(CHUNKS_DIR, MANIFEST_JS_FILENAME)

  const manifestJson = JSON.stringify(manifest, null, 2)

  const fileContents = `/**
 * Auto-generated chunk SRI manifest.
 * DO NOT EDIT.
 * Generated at: ${new Date().toISOString()}
 */
(function() {
  'use strict';

  // Validate manifest integrity
  var manifest = ${manifestJson};

  // Basic validation: check manifest is an object with valid SRI hashes
  if (typeof manifest !== 'object' || manifest === null) {
    console.error('[SRI] Invalid manifest: not an object');
    return;
  }

  // Validate hash format for first entry (sha384-base64)
  var firstKey = Object.keys(manifest)[0];
  if (firstKey && !/^sha384-[A-Za-z0-9+/=]+$/.test(manifest[firstKey])) {
    console.error('[SRI] Invalid manifest: malformed hash format');
    return;
  }

  // Freeze manifest to prevent tampering
  if (Object.freeze) {
    Object.freeze(manifest);
  }

  window.__CHUNK_SRI_MANIFEST = manifest;
})();
`

  fs.writeFileSync(manifestPath, fileContents, 'utf8')
  console.log(`Generated chunk SRI manifest with ${Object.keys(manifest).length} chunks`)
}

/**
 * Main entry point
 * Generates the chunk SRI manifest from actual files, then processes HTML files
 */
function main() {
  console.log('Generating SRI hashes from built files...')

  // 1. Generate chunk manifest from actual files on disk (after Next.js export)
  const chunkManifest = generateChunkManifest()
  writeChunkManifest(chunkManifest)

  // 2. Process HTML files: inject manifest script tag and add SRI to static scripts
  const manifestScriptPublicPath = `/_next/static/chunks/${MANIFEST_JS_FILENAME}`
  const totalProcessed = processAllHtmlFiles(OUT_DIR, manifestScriptPublicPath)

  console.log(`SRI processing complete: added integrity to ${totalProcessed} scripts across all HTML files.`)
}

main()
