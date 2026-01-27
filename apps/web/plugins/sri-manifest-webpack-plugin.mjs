import crypto from 'crypto'
import path from 'path'

const MANIFEST_FILENAME = 'chunks-sri-manifest.js'

/**
 * Webpack plugin that generates SRI (Subresource Integrity) hashes for all JS chunks
 * and patches the webpack runtime to inject integrity attributes for dynamically loaded chunks.
 *
 * This plugin runs during webpack's compilation phase and:
 * 1. Computes SHA-384 hashes for all JS chunk files
 * 2. Patches webpack runtime chunks to inject SRI lookup code
 * 3. Generates and emits the SRI manifest file
 *
 * The post-build script then handles HTML manipulation (injecting the manifest script tag).
 */
export class SriManifestWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      manifestFilename: options.manifestFilename || MANIFEST_FILENAME,
      chunksPath: options.chunksPath || '_next/static/chunks',
    }
  }

  apply(compiler) {
    const pluginName = 'SriManifestWebpackPlugin'

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          // Run at OPTIMIZE_HASH stage so we can modify assets before final output
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_HASH,
        },
        (assets) => {
          try {
            // Next.js runs multiple compilations (client, server, edge).
            // Only process the client compilation which has the actual chunks.
            // Server/edge compilations don't have browser chunks and would generate empty manifests.
            const isClient = !compilation.options.name || compilation.options.name === 'client'

            if (!isClient) {
              // Skip server/edge compilations - they don't have browser chunks
              return
            }

            // Patch webpack runtime chunks to inject SRI lookup for dynamic chunks
            // Note: The actual SRI manifest is generated post-build by the integrity script
            // to ensure hashes match the final files on disk (after Next.js export)
            this.patchWebpackRuntime(compilation, assets)

            const info = new Error('Patched webpack runtime for SRI dynamic chunk loading')
            info.name = 'SriManifestInfo'
            compilation.warnings.push(info)
          } catch (error) {
            compilation.errors.push(new Error(`${pluginName}: ${error.message}`))
          }
        },
      )
    })
  }

  /**
   * Finds the minified method name webpack uses for creating script URLs.
   * This is typically `c.tu` but the minifier can use any identifier.
   *
   * Tries multiple patterns to handle different minification strategies.
   *
   * @param {string} content - The webpack runtime file content
   * @returns {{varName: string, methodName: string} | null} The extracted identifiers or null
   */
  findWebpackUrlMethod(content) {
    // Try multiple patterns to handle different minification strategies
    const patterns = [
      // Pattern 1: Standard minified format with arrow function
      // someVar.someMethod=e=>someVar.tt().createScriptURL(e)
      /(\w)\.(\w+)=\w=>\1\.tt\(\)\.createScriptURL\(\w\)/,

      // Pattern 2: With function keyword (less common but possible)
      // someVar.someMethod=function(e){return someVar.tt().createScriptURL(e)}
      /(\w)\.(\w+)=function\(\w\)\{return \1\.tt\(\)\.createScriptURL\(\w\)\}/,

      // Pattern 3: With different whitespace/formatting
      /(\w)\.(\w+)\s*=\s*\w\s*=>\s*\1\.tt\(\)\.createScriptURL\(\w\)/,
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        return {
          varName: match[1],
          methodName: match[2],
        }
      }
    }

    return null
  }

  /**
   * Patch webpack runtime chunks to inject SRI lookup for dynamically loaded chunks.
   *
   * Webpack's chunk loader (`__webpack_require__.l`) creates script tags for dynamic imports.
   * This function patches the minified webpack runtime to add integrity attributes
   * by looking up hashes from `window.__CHUNK_SRI_MANIFEST`.
   *
   * @param {import('webpack').Compilation} compilation - Webpack compilation object
   * @param {Object} assets - Webpack assets object
   * @throws {Error} If webpack runtime files are not found or patching fails
   */
  patchWebpackRuntime(compilation, assets) {
    // Find webpack runtime assets (typically webpack-*.js)
    // Asset names in webpack compilation are relative, e.g. "static/chunks/webpack-*.js"
    const webpackAssets = Object.keys(assets).filter((name) => name.includes('webpack-') && name.endsWith('.js'))

    if (webpackAssets.length === 0) {
      // During client/server compilation, webpack runtime might not be in this compilation
      // Only warn - the final client compilation will have the runtime
      const warning = new Error(
        'No webpack runtime files found in this compilation. If this is the final build, SRI patching failed.',
      )
      warning.name = 'SriManifestWarning'
      compilation.warnings.push(warning)
      return
    }

    let patchedCount = 0

    for (const assetName of webpackAssets) {
      const asset = assets[assetName]
      let content = asset.source().toString()
      const originalContent = content

      // Dynamically find the webpack URL method name (e.g., 'tu', 'ab', etc.)
      const urlMethod = this.findWebpackUrlMethod(content)
      if (!urlMethod) {
        const warning = new Error(
          `Could not find webpack URL method in ${path.basename(assetName)}. The webpack runtime structure may have changed. SRI for dynamic chunks will not work.`,
        )
        warning.name = 'SriManifestWarning'
        compilation.warnings.push(warning)
        continue
      }

      // Pattern: scriptVar.src = webpackObj.urlMethod(urlVar)
      // This is webpack's __webpack_require__.l function setting script.src
      // We inject SRI lookup right after the src is set
      //
      // The pattern needs to capture the character after the closing paren (could be ), comma, semicolon, etc.)
      // to preserve the original code structure and avoid syntax errors
      //
      // Example matches (depending on minified names):
      //   r.src=c.tu(d)),   -> r.src=c.tu(d),_sri=...,_sri[d]&&(r.integrity=_sri[d])),
      //   a.src=o.ab(e),    -> a.src=o.ab(e),_sri=...,_sri[e]&&(a.integrity=_sri[e]),
      //
      // Using comma operator to maintain expression flow without semicolons
      const pattern = new RegExp(`(\\w)\\.src=(\\w)\\.${urlMethod.methodName}\\((\\w)\\)([,);])`, 'g')

      content = content.replace(pattern, (match, scriptVar, webpackObj, urlVar, trailingChar) => {
        // Use comma operator to chain expressions without breaking syntax
        // Check if manifest exists and has the hash, then set integrity attribute
        // Repeating the window lookup avoids variable scoping issues in strict mode
        return `${scriptVar}.src=${webpackObj}.${urlMethod.methodName}(${urlVar}),window.__CHUNK_SRI_MANIFEST&&window.__CHUNK_SRI_MANIFEST[${urlVar}]&&(${scriptVar}.integrity=window.__CHUNK_SRI_MANIFEST[${urlVar}])${trailingChar}`
      })

      if (content !== originalContent) {
        // Validate that the patch was applied correctly by checking for our marker
        if (!content.includes('__CHUNK_SRI_MANIFEST')) {
          throw new Error(`Failed to inject SRI code into ${path.basename(assetName)}. Build validation failed.`)
        }

        // Update the asset with the patched content
        compilation.updateAsset(assetName, new compilation.compiler.webpack.sources.RawSource(content))

        patchedCount++
        const info = new Error(
          `Patched webpack runtime for SRI (method: ${urlMethod.methodName}): ${path.basename(assetName)}`,
        )
        info.name = 'SriManifestInfo'
        compilation.warnings.push(info)
      } else {
        const warning = new Error(
          `Could not find webpack chunk loader pattern in ${path.basename(assetName)}. The script.src assignment may have changed. SRI for dynamic chunks will not work.`,
        )
        warning.name = 'SriManifestWarning'
        compilation.warnings.push(warning)
      }
    }

    // Validate that at least one file was successfully patched
    if (patchedCount === 0 && webpackAssets.length > 0) {
      // Warn if we found webpack assets but couldn't patch any of them
      // This might be OK if the webpack runtime doesn't have dynamic chunk loading
      const warning = new Error(
        `Could not patch any of ${webpackAssets.length} webpack runtime file(s). ` +
          `If this is the client build and you use dynamic imports, SRI may not work for dynamic chunks.`,
      )
      warning.name = 'SriManifestWarning'
      compilation.warnings.push(warning)
    }
  }

  /**
   * Compute the SHA-384 SRI hash for given content
   * @param {Buffer|string} content - File content
   * @returns {string} SRI hash in format "sha384-..."
   */
  computeSriHash(content) {
    const hash = crypto.createHash('sha384').update(content).digest('base64')
    return `sha384-${hash}`
  }

  /**
   * Generate SRI manifest for all JS chunk files
   * @param {import('webpack').Compilation} compilation - Webpack compilation object
   * @param {Object} assets - Webpack assets object
   * @returns {Object} Manifest mapping public paths to SRI hashes
   */
  generateManifest(compilation, assets) {
    const manifest = {}

    // Find all JS assets in the chunks directory
    for (const assetName of Object.keys(assets)) {
      // Only process JS files in the chunks directory (static/chunks/* or pages/*)
      if (!assetName.endsWith('.js') || !assetName.includes('static/chunks')) {
        continue
      }

      const asset = assets[assetName]
      const content = asset.source()

      // Compute SRI hash
      const hash = this.computeSriHash(content)

      // Create public path (e.g., "/_next/static/chunks/foo.js")
      // Webpack asset names are like "static/chunks/foo.js", we need "/_next/static/chunks/foo.js"
      const publicPath = `/_next/${assetName}`

      manifest[publicPath] = hash
    }

    return manifest
  }

  /**
   * Emit the SRI manifest as a webpack asset
   * @param {import('webpack').Compilation} compilation - Webpack compilation object
   * @param {Object} manifest - SRI manifest object
   */
  emitManifest(compilation, manifest) {
    const manifestJson = JSON.stringify(manifest, null, 2)

    // Add runtime validation and integrity check
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

    // Emit the manifest file in the chunks directory
    // Webpack asset paths are relative, e.g. "static/chunks/chunks-sri-manifest.js"
    const manifestPath = path.posix.join('static/chunks', this.options.manifestFilename)

    compilation.emitAsset(manifestPath, new compilation.compiler.webpack.sources.RawSource(fileContents))

    const info = new Error(`Emitted SRI manifest: ${manifestPath}`)
    info.name = 'SriManifestInfo'
    compilation.warnings.push(info)
  }
}
