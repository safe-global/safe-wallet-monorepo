/* eslint-disable no-undef */
const { withPodfile, withAppDelegate, withMainApplication, withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')
// SSL Pinning Configuration will be passed from app.config.js

function withIOSSSLPinning(config, { domains }) {
  // Add TrustKit to Podfile
  config = withPodfile(config, (config) => {
    const podfileContent = config.modResults.contents

    // Check if TrustKit is already added
    if (!podfileContent.includes('TrustKit')) {
      // Add TrustKit pod
      const podfileLines = podfileContent.split('\n')
      const targetIndex = podfileLines.findIndex((line) => line.includes('use_expo_modules!'))

      if (targetIndex !== -1) {
        podfileLines.splice(targetIndex + 1, 0, "  pod 'TrustKit'")
        config.modResults.contents = podfileLines.join('\n')
      }
    }

    return config
  })

  // Modify AppDelegate.swift to include SSL pinning
  config = withAppDelegate(config, (config) => {
    const appDelegateContent = config.modResults.contents

    const domainConfigs = Object.entries(domains)
      .map(([domain, hashes]) => {
        const hashesString = hashes.map((hash) => `"${hash}"`).join(', ')
        return `          "${domain}": [
            kTSKPublicKeyHashes: [${hashesString}],
            kTSKEnforcePinning: true,
            kTSKIncludeSubdomains: true,
            kTSKReportUris: []
          ]`
      })
      .join(',\n')

    const trustKitConfig = `
    // SSL Pinning Configuration
    let trustKitConfig: [String: Any] = [
      kTSKSwizzleNetworkDelegates: true,
      kTSKPinnedDomains: [
${domainConfigs}
      ]
    ]
    
    TrustKit.initSharedInstance(withConfiguration: trustKitConfig)
    print("SSL Pinning initialized successfully")
    `

    // Add TrustKit import if not present
    if (!appDelegateContent.includes('import TrustKit')) {
      config.modResults.contents = appDelegateContent.replace(
        'import ReactAppDependencyProvider',
        'import ReactAppDependencyProvider\nimport TrustKit',
      )
    }

    // Add TrustKit initialization before React Native starts
    if (!appDelegateContent.includes('TrustKit.initSharedInstance')) {
      // Primary injection point: before factory.startReactNative
      const startReactNativePattern = /([ ]+)(factory\.startReactNative\(\s*withModuleName:)/

      if (startReactNativePattern.test(appDelegateContent)) {
        config.modResults.contents = config.modResults.contents.replace(
          startReactNativePattern,
          `${trustKitConfig}
$1$2`,
        )
      } else {
        // Fallback: after window initialization
        const windowPattern = /(window = UIWindow\(frame: UIScreen\.main\.bounds\))/

        if (windowPattern.test(appDelegateContent)) {
          config.modResults.contents = config.modResults.contents.replace(windowPattern, `$1${trustKitConfig}`)
        } else {
          console.warn('⚠️ Could not find suitable injection point for SSL Pinning in AppDelegate.swift')
        }
      }
    }

    return config
  })

  return config
}

function withAndroidSSLPinning(config, { domains }) {
  // Create SSLPinningFactory.kt
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package || 'global.safe.mobileapp'
      const packagePath = packageName.replace(/\./g, '/')
      const kotlinDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/java', packagePath)

      // Ensure directory exists
      if (!fs.existsSync(kotlinDir)) {
        fs.mkdirSync(kotlinDir, { recursive: true })
      }

      // domains passed from configuration
      const pinningConfig = Object.entries(domains)
        .map(([domain, hashes]) => {
          const hashesString = hashes.map((hash) => `"sha256/${hash}"`).join(', ')
          return `            .add("${domain}", ${hashesString})`
        })
        .join('\n')

      const sslPinningFactoryContent = `package ${packageName}

import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.ReactCookieJarContainer
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient

class SSLPinningFactory : OkHttpClientFactory {
    
    override fun createNewNetworkModuleClient(): OkHttpClient {
        val certificatePinner = CertificatePinner.Builder()
${pinningConfig}
            .build()
        
        return OkHttpClient.Builder()
            .certificatePinner(certificatePinner)
            .cookieJar(ReactCookieJarContainer())
            .build()
    }
}`

      const sslPinningFactoryPath = path.join(kotlinDir, 'SSLPinningFactory.kt')
      fs.writeFileSync(sslPinningFactoryPath, sslPinningFactoryContent)

      return config
    },
  ])

  // Modify MainApplication.kt
  config = withMainApplication(config, (config) => {
    const mainApplicationContent = config.modResults.contents
    const packageName = config.android?.package || 'global.safe.mobileapp'

    // Add imports if not present
    if (!mainApplicationContent.includes('import com.facebook.react.modules.network.OkHttpClientProvider')) {
      config.modResults.contents = mainApplicationContent.replace(
        'import com.facebook.react.ReactApplication',
        `import com.facebook.react.ReactApplication
import com.facebook.react.modules.network.OkHttpClientProvider
import ${packageName}.SSLPinningFactory`,
      )
    }

    // Add SSL pinning initialization in onCreate
    if (!mainApplicationContent.includes('OkHttpClientProvider.setOkHttpClientFactory')) {
      const onCreatePattern = /(override fun onCreate\(\) {\s*super\.onCreate\(\))/s

      config.modResults.contents = config.modResults.contents.replace(
        onCreatePattern,
        `$1
    
    // Initialize SSL Pinning
    OkHttpClientProvider.setOkHttpClientFactory(SSLPinningFactory())`,
      )
    }

    return config
  })

  return config
}

module.exports = function withSSLPinning(config, options = {}) {
  const { domains = {} } = options

  // Apply iOS SSL pinning
  config = withIOSSSLPinning(config, { domains })

  // Apply Android SSL pinning
  config = withAndroidSSLPinning(config, { domains })

  return config
}
