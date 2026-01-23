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
            // 1. First patch webpack runtime chunks (before computing their hashes)
            this.patchWebpackRuntime(compilation, assets)

            // 2. Generate SRI manifest for all JS chunks (including patched webpack)
            const manifest = this.generateManifest(compilation, assets)

            // 3. Emit the manifest file as a webpack asset
            this.emitManifest(compilation, manifest)

            console.log(`[${pluginName}] Generated SRI manifest with ${Object.keys(manifest).length} chunks`)
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
   * Looks for: varName.methodName=e=>varName.tt().createScriptURL(e)
   *
   * @param {string} content - The webpack runtime file content
   * @returns {{varName: string, methodName: string} | null} The extracted identifiers or null
   */
  findWebpackUrlMethod(content) {
    // Match: someVar.someMethod=e=>someVar.tt().createScriptURL(e)
    // This is webpack's Trusted Types URL creator: __webpack_require__.tu
    const match = content.match(/(\w)\.(\w+)=\w=>\1\.tt\(\)\.createScriptURL\(\w\)/)
    if (match) {
      return {
        varName: match[1],
        methodName: match[2],
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
   */
  patchWebpackRuntime(compilation, assets) {
    // Find webpack runtime assets (typically webpack-*.js)
    // Asset names in webpack compilation are relative, e.g. "static/chunks/webpack-*.js"
    const webpackAssets = Object.keys(assets).filter((name) => name.includes('webpack-') && name.endsWith('.js'))

    if (webpackAssets.length === 0) {
      console.warn('[SriManifestWebpackPlugin] Warning: No webpack runtime files found')
      return
    }

    for (const assetName of webpackAssets) {
      const asset = assets[assetName]
      let content = asset.source().toString()
      const originalContent = content

      // Dynamically find the webpack URL method name (e.g., 'tu', 'ab', etc.)
      const urlMethod = this.findWebpackUrlMethod(content)
      if (!urlMethod) {
        console.warn(
          `[SriManifestWebpackPlugin] Warning: Could not find webpack URL method in ${path.basename(assetName)}`,
        )
        continue
      }

      // Pattern: scriptVar.src = webpackObj.urlMethod(urlVar)
      // This is webpack's __webpack_require__.l function setting script.src
      // We inject SRI lookup right after the src is set
      //
      // Example matches (depending on minified names):
      //   r.src=c.tu(d)
      //   a.src=o.ab(e)
      //
      // Transforms to:
      //   r.src=c.tu(d);var _sri=window.__CHUNK_SRI_MANIFEST||{};if(_sri[d])r.integrity=_sri[d]
      const pattern = new RegExp(`(\\w)\\.src=(\\w)\\.${urlMethod.methodName}\\((\\w)\\)`, 'g')

      content = content.replace(
        pattern,
        `$1.src=$2.${urlMethod.methodName}($3);var _sri=window.__CHUNK_SRI_MANIFEST||{};if(_sri[$3])$1.integrity=_sri[$3]`,
      )

      if (content !== originalContent) {
        // Update the asset with the patched content
        compilation.updateAsset(assetName, new compilation.compiler.webpack.sources.RawSource(content))

        console.log(
          `[SriManifestWebpackPlugin] Patched webpack runtime for SRI (using method: ${urlMethod.methodName}): ${path.basename(assetName)}`,
        )
      } else {
        console.warn(
          `[SriManifestWebpackPlugin] Warning: Could not find webpack chunk loader pattern in ${path.basename(assetName)}`,
        )
      }
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

    const fileContents = `/**
 * Auto-generated chunk SRI manifest.
 * DO NOT EDIT.
 */
window.__CHUNK_SRI_MANIFEST = ${manifestJson};
`

    // Emit the manifest file in the chunks directory
    // Webpack asset paths are relative, e.g. "static/chunks/chunks-sri-manifest.js"
    const manifestPath = path.posix.join('static/chunks', this.options.manifestFilename)

    compilation.emitAsset(manifestPath, new compilation.compiler.webpack.sources.RawSource(fileContents))

    console.log(`[SriManifestWebpackPlugin] Emitted manifest: ${manifestPath}`)
  }
}
