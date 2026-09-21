// All platform polyfills, imported as the FIRST module of the app entry (index.js).
// Ordering inside this file matters: compat installs globalThis.crypto.getRandomValues
// (via react-native-get-random-values) before crypto-shims evaluates — its ethers
// import pulls in @noble/*, which snapshot globalThis.crypto at module-load time.
// A wrong order breaks WalletConnect pairing, reproducible only in release builds.
import '@/src/features/WalletConnect/shared/compat'
import '@/src/platform/crypto-shims'
import '@/src/platform/fetch'
import '@/src/platform/intl-polyfills'
