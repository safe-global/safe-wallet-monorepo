#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-undef */

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

// All Amazon Trust Services root CAs (https://www.amazontrust.com/repository/).
// Keep in sync with amazonRootCAs in apps/mobile/app.config.ts.
const ATS_ROOTS = {
  '++MBgDH5WGvL9Bcn5Be30cRcL0f5O+NyoXuWtQdX1aI=': 'Amazon Root CA 1 (RSA 2048, valid until: Jan 17 2038)',
  'f0KW/FtqTjs108NpYj42SrGvOB2PpxIVM8nWxjPqJGE=': 'Amazon Root CA 2 (RSA 4096, valid until: May 26 2040)',
  'NqvDJlas/GRcYbcWE8S/IceH9cq77kg0jVhZeAPXq8k=': 'Amazon Root CA 3 (ECDSA 256, valid until: May 26 2040)',
  '9+ze1cZgR9KO1kZrVDxA4HQ6voHRCSVNz4RdTCx4U8U=': 'Amazon Root CA 4 (ECDSA 384, valid until: May 26 2040)',
  'KwccWaCgrnaw6tsrrSO61FgLacNgG2MMLq8GE6+oP5I=': 'Starfield Services Root CA - G2 (valid until: Dec 31 2037)',
  'jZNVWOajyJYzAUj/32oawKW/uhq0RUUTWjs3bJoaMI0=': 'Amazon RSA 2048 Root EU M1 (valid until: Nov 14 2042)',
  'lWWQdyVGS+C/9EsSMvhe6GKpoNmduXG6IDRKr0FDHVg=': 'Amazon ECDSA 256 Root EU M1 (valid until: Nov 14 2042)',
  'eY/hCVfoxaCHQgHK8J1e9LLiQSxHv5kZSVZstULTrz8=': 'Amazon ECDSA 384 Root EU M1 (valid until: Nov 14 2042)',
}

function certRole(cert, index) {
  if (index === 0) {
    return '🍃 Leaf'
  }
  const selfSigned = JSON.stringify(cert.subject) === JSON.stringify(cert.issuer)
  return selfSigned ? '🌳 Root' : '🔗 CA'
}

function displayCertificateInfo(domain, chain) {
  console.log(`\n🔐 SSL Certificate Chain for ${domain}`)
  console.log('='.repeat(60))

  if (chain.length === 0) {
    console.log('❌ No certificates found')
    return
  }

  console.log('\n📜 Certificate Chain (with SPKI hashes):')
  chain.forEach((cert, index) => {
    console.log(`\n${certRole(cert, index)}: ${cert.subject.CN || cert.subject.O || 'Unknown'}`)
    console.log(`   Valid: ${cert.valid_from} → ${cert.valid_to}`)
    console.log(`   SPKI:  ${extractCertificateHash(cert)}`)
  })

  console.log('\n🎯 SSL Pinning Configuration (pin root keys — leaves and intermediates rotate):')
  console.log('='.repeat(35))

  const isAmazonChain = chain.slice(1).some((cert) => ATS_ROOTS[extractCertificateHash(cert)])
  if (isAmazonChain) {
    console.log('💡 Amazon/ACM-issued chain detected. Renewals can switch to a different Amazon root,')
    console.log('   so pin ALL Amazon Trust Services roots, not just the ones served in this chain')
    console.log('   (https://docs.aws.amazon.com/acm/latest/userguide/acm-bestpractices.html#best-practices-pinning):')
    console.log(`'${domain}': [`)
    Object.entries(ATS_ROOTS).forEach(([hash, name]) => {
      console.log(`  '${hash}', // 🌳 ${name}`)
    })
    console.log(`],`)
    console.log('\n   This matches amazonRootCAs in apps/mobile/app.config.ts.')
  } else {
    const roots = chain.filter((cert, index) => certRole(cert, index) === '🌳 Root')
    if (roots.length === 0) {
      console.log('⚠️  The served chain does not include a self-signed root. Fetch the issuing CA root')
      console.log("   from the CA's official repository and pin its SPKI hash — do NOT pin the")
      console.log('   intermediates above, they rotate.')
    } else {
      console.log("💡 Pin the CA's full advertised root set if it publishes one — chains can move")
      console.log('   between roots of the same CA on renewal. Roots served in this chain:')
      console.log(`'${domain}': [`)
      roots.forEach((cert) => {
        console.log(`  '${extractCertificateHash(cert)}', // 🌳 ${cert.subject.CN || cert.subject.O}`)
      })
      console.log(`],`)
    }
  }

  console.log('\n🛠️  Manual verification:')
  console.log('='.repeat(30))
  console.log('# Get full certificate chain:')
  console.log(`openssl s_client -servername ${domain} -connect ${domain}:443 -showcerts`)
  console.log('# SPKI hash of any certificate PEM:')
  console.log(
    'openssl x509 -in cert.pem -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64',
  )
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
    console.log('\nThis script prints the SPKI hash of every certificate in the served chain')
    console.log('and recommends pinning CA/root keys, which survive leaf rotation.')
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
  console.log('- Pin CA/root public keys, NOT the leaf — ACM re-keys the leaf on every renewal (~6 months),')
  console.log('  which silently invalidates leaf pins and can swap the issuing intermediate')
  console.log('- For Amazon/ACM certs, pin all Amazon Trust Services roots (AWS best practice)')
  console.log('- SPKI pins match keys, not certificates — cross-signed variants of a root match the same pin')
  console.log('- Test SSL pinning with an invalid hash to verify enforcement works')
  console.log('- Re-run this script after infra/CDN changes to confirm the served chain still chains to pinned roots')
}

if (require.main === module) {
  main().catch(console.error)
}
