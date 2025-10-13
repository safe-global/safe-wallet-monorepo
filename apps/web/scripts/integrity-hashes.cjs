const readline = require('readline')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const cheerio = require('cheerio')
const secp = require('@noble/secp256k1')
const { keccak_256 } = require('@noble/hashes/sha3.js')
const { sha256 } = require('@noble/hashes/sha2.js')
const { hmac } = require('@noble/hashes/hmac.js')
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg)
secp.hashes.sha256 = sha256

const OUT_DIR = 'out'
const CHUNKS_DIR = path.join(OUT_DIR, '_next', 'static', 'chunks')
const MANIFEST_JS_FILENAME = 'chunks-sri-manifest.js'
const SIGN_ADDR = '0x0d5b81e9bd4d6ab0a0487ea9fe161a4152b11625'

function recoverPersonalSign(msgHash, signature) {
  if (signature.startsWith('0x')) {
    signature = signature.slice(2)
  }
  // Signature
  const sigBytes = secp.etc.hexToBytes(signature)
  // Message Hash
  const prefix = '\x19Ethereum Signed Message:\n'
  const messageHash = keccak_256(
    secp.etc.concatBytes(new TextEncoder('utf-8').encode(prefix + msgHash.length), msgHash),
  )
  const compressedPubKey = secp.recoverPublicKey(sigBytes, messageHash, { prehash: false })
  const point = secp.Point.fromBytes(compressedPubKey)
  const keccak = keccak_256(point.toBytes(false).slice(1))
  return '0x' + secp.etc.bytesToHex(keccak.slice(-20))
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

      console.log('Added integrity hash', integrityVal, scriptSrc, htmlFilePath)
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
 * Verifies the signature of the manifest data and saves it to a JSON file.
 * The function checks if the recovered signer matches the expected SIGN_ADDR.
 * If verification passes, saves the manifest data and signature to 'integrity-manifest.json'.
 */
function checkSigAndSaveDappfenceManifest(sig, manifestData, msgHash) {
  sig = sig.trim().toLowerCase()
  if (sig.startsWith('0x')) {
    sig = sig.slice(2)
  }
  if (sig.length === 64) {
    // Message Hash
    const prefix = '\x19Ethereum Signed Message:\n'
    const messageHash = keccak_256(
      secp.etc.concatBytes(new TextEncoder('utf-8').encode(prefix + msgHash.length), msgHash),
    )
    sig = secp.etc.bytesToHex(
      secp.sign(messageHash, secp.etc.hexToBytes(sig), {
        format: 'recovered',
        prehash: false,
        lowS: true,
      }),
    )
  }
  const recovered = recoverPersonalSign(msgHash, sig)
  console.log('recovered', recovered)
  if (recovered.toLowerCase() !== SIGN_ADDR.toLowerCase()) {
    throw new Error(`invalid signature 0x${sig.startsWith('0x') ? sig.slice(2) : sig}, ${SIGN_ADDR} != ${recovered}`)
  }
  const manifest = {
    pay: manifestData,
    sig,
  }
  const manifestJsPath = path.join(OUT_DIR, 'integrity-manifest.json')
  const manifestText = JSON.stringify(manifest, null, 2)
  fs.writeFileSync(manifestJsPath, manifestText, 'utf8')
}

/**
 * Write the manifest file in `/integrity-manifest.json`.
 * This is just a temproray hack, we will write a webpack pluging to make it cleaner!!!
 */
function writeDappfenceManifest() {
  const extensions = ['.js', '.html', '.json', '.css', '.svg']
  const files = {}
  function recurse(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        recurse(entryPath)
      } else if (entry.isFile()) {
        if (extensions.some((x) => entry.name.endsWith(x))) {
          // filePath is absolute, e.g. /path/to/out/_next/static/chunks/foo.js
          // We want to create a key like "/_next/static/chunks/foo.js"
          const relPath = path.relative(OUT_DIR, entryPath).replace(/\\/g, '/')
          // On Windows, ensure forward slashes
          const publicPath = `/${relPath}`
          const content = fs.readFileSync(entryPath)
          const hash = crypto.createHash('sha256').update(content).digest('base64')
          files[publicPath] = `sha256-${hash}`
        }
      }
    }
  }
  recurse(OUT_DIR)
  const manifestData = {
    files: files,
    metadata: {
      extensions,
      contentTypes: ['text/javascript', 'text/html', 'application/json'],
      buildTime: '2025-10-21T14:04:56.924Z', // new Date().toISOString(),
      version: '1.0.0', // TODO
      target: 'safe-app', // TODO
    },
  }
  const msg = new TextEncoder('utf-8').encode(JSON.stringify(manifestData, null, 2))
  const msgHash = keccak_256(msg)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question(
    `sign it with your wallet ${SIGN_ADDR} the following hash 0x${secp.etc.bytesToHex(msgHash).toLowerCase()}\n`,
    (answer) => {
      checkSigAndSaveDappfenceManifest(answer.toLowerCase(), manifestData, msgHash)
      rl.close() // Important: Close the interface to end the program
    },
  )
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

  // This is just a temproray hack, we will write a webpack pluging to make it cleaner!!!
  // Must be executed after we modify files in addSRIToAllHtmlFiles
  writeDappfenceManifest(sriManifest)
  console.log(`Added integrity-manifest.json`)
}

main()
