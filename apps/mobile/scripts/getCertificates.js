#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console, no-undef */

/**
 * SSL Certificate Extractor for SSL Pinning
 *
 * This script extracts certificate hashes needed for SSL pinning configuration.
 *
 * Usage: node scripts/getCertificates.js <domain1> [domain2] [domain3] ...
 */

const https = require('https')
const crypto = require('crypto')

function getFullCertificateChain(hostname, port = 443) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      method: 'HEAD',
      rejectUnauthorized: false,
    }

    const req = https.request(options, (res) => {
      try {
        const cert = res.connection.getPeerCertificate(true)

        if (!cert || Object.keys(cert).length === 0) {
          reject(new Error('No certificate found'))
          return
        }

        const chain = []
        const seenCerts = new Set() // Track certificate fingerprints to prevent loops
        const MAX_CHAIN_LENGTH = 10 // Reasonable limit for certificate chain

        // Walk the certificate chain
        let currentCert = cert
        let chainLength = 0

        while (currentCert && Object.keys(currentCert).length > 0 && chainLength < MAX_CHAIN_LENGTH) {
          // Create a unique identifier for this certificate
          const certId = currentCert.fingerprint || `${currentCert.subject?.CN}-${currentCert.issuer?.CN}`

          // Check for circular references
          if (seenCerts.has(certId)) {
            console.log(`🔄 Circular reference detected at certificate: ${certId}`)
            break
          }

          seenCerts.add(certId)
          chain.push(currentCert)
          chainLength++

          // Move to issuer certificate
          const nextCert = currentCert.issuerCertificate

          // Additional safety checks
          if (!nextCert || nextCert === currentCert) {
            break
          }

          // Check if we've reached the root (self-signed)
          if (
            currentCert.subject &&
            currentCert.issuer &&
            JSON.stringify(currentCert.subject) === JSON.stringify(currentCert.issuer)
          ) {
            console.log(`🌳 Reached self-signed root certificate: ${currentCert.subject?.CN}`)
            break
          }

          currentCert = nextCert
        }

        if (chainLength >= MAX_CHAIN_LENGTH) {
          console.log(`⚠️  Certificate chain truncated at ${MAX_CHAIN_LENGTH} certificates`)
        }

        console.log(`📋 Found ${chain.length} certificates in chain`)
        resolve(chain)
      } catch (error) {
        reject(new Error(`Failed to parse certificate chain: ${error.message}`))
      }
    })

    req.on('error', reject)
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error(`Timeout connecting to ${hostname}:${port}`))
    })

    req.end()
  })
}

function extractCertificateHash(cert) {
  const publicKeyDer = cert.pubkey
  return crypto.createHash('sha256').update(publicKeyDer).digest('base64')
}

function displayCertificateInfo(domain, chain) {
  console.log(`\n🔐 SSL Certificate Chain for ${domain}`)
  console.log('='.repeat(60))

  if (chain.length === 0) {
    console.log('❌ No certificates found')
    return
  }

  if (chain.length < 2) {
    console.log('⚠️  Only root certificate available - no intermediate found')
    console.log('💡 Consider using the root certificate as backup')
  }

  const leafCert = chain[0]
  const intermediateCert = chain[1]
  const rootCert = chain[chain.length - 1]

  console.log('\n📋 Certificate Chain:')
  console.log(`🍃 Leaf: ${leafCert.subject.CN || leafCert.subject.O || 'Unknown'}`)

  if (intermediateCert && intermediateCert !== leafCert) {
    console.log(`🔗 Intermediate: ${intermediateCert.subject.CN || intermediateCert.subject.O || 'Unknown'}`)
  }

  if (rootCert && rootCert !== leafCert && rootCert !== intermediateCert) {
    console.log(`🌳 Root: ${rootCert.subject.CN || rootCert.subject.O || 'Unknown'}`)
  }

  const leafHash = extractCertificateHash(leafCert)
  const intermediateHash = intermediateCert ? extractCertificateHash(intermediateCert) : null
  const rootHash = rootCert ? extractCertificateHash(rootCert) : null

  console.log('\n🎯 SSL Pinning Configuration:')
  console.log('='.repeat(35))
  console.log(`'${domain}': [`)
  console.log(`  '${leafHash}', // 🍃 Leaf (primary)`)

  if (intermediateHash && intermediateHash !== leafHash) {
    console.log(`  '${intermediateHash}', // 🔗 Intermediate (could be used as backup, but need to trust CA authority)`)
  } else if (rootHash && rootHash !== leafHash) {
    console.log(`  '${rootHash}', // 🌳 Root (backup)`)
  }

  console.log(`],`)

  // Show certificate details
  console.log('\n📜 Certificate Details:')
  console.log('='.repeat(25))

  console.log(`\n🍃 Leaf Certificate:`)
  console.log(`   Subject: ${leafCert.subject.CN || leafCert.subject.O}`)
  console.log(`   Valid: ${leafCert.valid_from} → ${leafCert.valid_to}`)
  console.log(`   Hash: ${leafHash}`)

  if (intermediateCert && intermediateHash !== leafHash) {
    console.log(`\n🔗 Intermediate Certificate:`)
    console.log(`   Subject: ${intermediateCert.subject.CN || intermediateCert.subject.O}`)
    console.log(`   Valid: ${intermediateCert.valid_from} → ${intermediateCert.valid_to}`)
    console.log(`   Hash: ${intermediateHash}`)
    console.log(`   💡 Recommended for backup pinning (more stable than leaf)`)
  }

  console.log('\n🛠️  Manual OpenSSL Commands:')
  console.log('='.repeat(30))
  console.log('# Get full certificate chain:')
  console.log(`openssl s_client -servername ${domain} -connect ${domain}:443 -showcerts > ${domain}-chain.pem`)

  if (intermediateCert) {
    console.log('\n# Extract intermediate certificate:')
    console.log(
      `awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/' ${domain}-chain.pem | sed -n '2,/END CERTIFICATE/p' > ${domain}-intermediate.pem`,
    )
    console.log('\n# Get intermediate hash:')
    console.log(
      `openssl x509 -in ${domain}-intermediate.pem -pubkey -noout | openssl rsa -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64`,
    )
  }
}

async function main() {
  const domains = process.argv.slice(2)

  if (domains.length === 0) {
    console.log('🔐 SSL Certificate Extractor for SSL Pinning')
    console.log('='.repeat(45))
    console.log('\nUsage: node scripts/getCertificates.js <domain1> [domain2] [domain3] ...')
    console.log('\nExamples:')
    console.log('  node scripts/getCertificates.js safe.global')
    console.log('  node scripts/getCertificates.js safe-client.safe.global safe-client.staging.5afe.dev')
    console.log('\nThis script extracts certificate hashes for SSL pinning and recommends')
    console.log('using intermediate certificates as backup for better stability.')
    process.exit(1)
  }

  console.log('🚀 Analyzing SSL certificates for SSL pinning configuration...\n')

  for (const domain of domains) {
    try {
      console.log(`🔍 Connecting to ${domain}...`)
      const chain = await getFullCertificateChain(domain)
      displayCertificateInfo(domain, chain)

      if (domains.length > 1) {
        console.log('\n' + '='.repeat(80) + '\n')
      }
    } catch (error) {
      console.error(`❌ Error processing ${domain}: ${error.message}`)
    }
  }

  console.log('\n✅ Certificate analysis complete!')
  console.log('\n💡 SSL Pinning Best Practices:')
  console.log('- Pin the leaf certificate as primary')
  console.log('- Intermediate certificate as backup (more stable than leaf, but means you trust the intermediate)')
  console.log('- Monitor certificate expiration dates')
  console.log('- Test SSL pinning with invalid hashes to verify it works')
  console.log('- Update certificates before they expire to avoid app outages')
  console.log('- Intermediate certificates change less frequently than leaf certificates')
}

if (require.main === module) {
  main().catch(console.error)
}
