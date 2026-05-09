# SSL Pinning Expo Config Plugin

This plugin implements SSL certificate pinning for React Native apps using Expo, supporting both iOS and Android platforms.

## Features

- **iOS SSL Pinning**: Uses TrustKit library for secure certificate validation
- **Android SSL Pinning**: Uses OkHttp's built-in certificate pinner
- **Automatic native code modification**: Handles all necessary iOS and Android code changes

## How SSL Pinning Works

SSL pinning enhances security by embedding specific certificate hashes directly into your app code. This prevents man-in-the-middle attacks even if an attacker manages to install malicious certificates on the device or compromises a certificate authority.

## Getting Certificate Hashes

Before configuring the plugin, you need to obtain the public key hashes for your domains:

### Method 1: Use the Certificate Extraction Script (Recommended)

```bash
# This script automatically extracts certificates and provides ready-to-use SSL pinning configuration
cd apps/mobile
node scripts/getCertificates.js safe-client.safe.global

# Multiple domains at once
node scripts/getCertificates.js safe-client.safe.global safe-client.staging.5afe.dev
```

### Method 2: Manual OpenSSL Commands

#### Step 1: Get Full Certificate Chain

```bash
# Get the complete certificate chain
openssl s_client -servername example.com -connect example.com:443 -showcerts > fullchain.pem
```

#### Step 2: Extract Specific Certificates

```bash
# Extract leaf certificate (first certificate)
awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/' fullchain.pem | sed -n '1,/END CERTIFICATE/p' > leaf.pem

# Extract intermediate certificate (second certificate)
awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/' fullchain.pem | sed -n '2,/END CERTIFICATE/p' > intermediate.pem

# Extract root certificate (last certificate)
awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/' fullchain.pem | tail -n +2 > root.pem
```

#### Step 3: Generate Certificate Hashes

```bash
# Leaf certificate hash
openssl x509 -in leaf.pem -pubkey -noout | openssl rsa -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64

# Intermediate certificate hash (recommended for backup)
openssl x509 -in intermediate.pem -pubkey -noout | openssl rsa -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64

# Root certificate hash
openssl x509 -in root.pem -pubkey -noout | openssl rsa -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
```

## Configuration

### 1. Configure SSL Pinning Domains

Update `apps/mobile/app.config.js` to include your domains and certificate hashes in the SSL pinning plugin configuration:

```javascript
[
  './expo-plugins/ssl-pinning/withSSLPinning.js',
  {
    domains: {
      'api.safeglobal.io': [
        'PRIMARY_CERT_HASH_BASE64'
      ],
      'dev-api.safeglobal.io': [
        'DEV_PRIMARY_CERT_HASH_BASE64'
      ],
    },
  },
],
```

### 2. Plugin Configuration

The plugin is already integrated into the app configuration. Simply update the domains object with your certificate hashes.

## Environment Configuration

The plugin uses the same domain configuration for all builds. You can include both production and development/staging domains in the same configuration:

- All configured domains will be pinned across all build variants
- Include both production and staging/development domains as needed
- Each domain can have multiple certificate hashes for backup

## Testing SSL Pinning

### Testing Valid Certificates

1. Build and run your app
2. Make network requests to pinned domains
3. Requests should work normally

### Testing Invalid Certificates

1. Change one of the certificate hashes to an invalid value (e.g., all A's)
2. Rebuild the app completely
3. Clear app cache/data or reinstall
4. Network requests to pinned domains should fail

**Important**: iOS maintains a TLS session cache, so you may need to:

- Delete and reinstall the app
- Reset the iOS Simulator
- Wait for the cache to expire

### Using Proxy Tools

You can test SSL pinning using tools like:

- [Proxyman](https://proxyman.io/)
- [Charles Proxy](https://www.charlesproxy.com/)
- [OWASP ZAP](https://owasp.org/www-project-zap/)

When SSL pinning is working correctly, requests through these proxies should fail.

## References

- [Original Callstack SSL Pinning Tutorial](https://www.callstack.com/blog/ssl-pinning-in-react-native-apps)
- [TrustKit Documentation](https://github.com/datatheorem/TrustKit)
- [OkHttp Certificate Pinning](https://square.github.io/okhttp/features/https/)
