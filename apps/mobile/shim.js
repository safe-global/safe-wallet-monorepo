import { Platform } from 'react-native'
import * as Application from 'expo-application'
const originalFetch = global.fetch
global.fetch = (url, options = {}) => {
  options.headers = {
    ...options.headers,
    'User-Agent': `SafeMobile/${Platform.OS === 'ios' ? 'iOS' : 'Android'}/${Application.nativeApplicationVersion}/${Application.nativeBuildVersion}`,
    Origin: 'https://app.safe.global',
  }
  return originalFetch(url, options)
}

import { install } from 'react-native-quick-crypto'
install()

import { ethers } from 'ethers'

import crypto from 'react-native-quick-crypto'

ethers.randomBytes.register((length) => {
  return new Uint8Array(crypto.randomBytes(length))
})

ethers.computeHmac.register((algo, key, data) => {
  return crypto.createHmac(algo, key).update(data).digest()
})

ethers.pbkdf2.register((passwd, salt, iter, keylen, algo) => {
  return crypto.pbkdf2Sync(passwd, salt, iter, keylen, algo)
})

ethers.sha256.register((data) => {
  return crypto.createHash('sha256').update(data).digest()
})

ethers.sha512.register((data) => {
  return crypto.createHash('sha512').update(data).digest()
})
