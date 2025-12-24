/* eslint-disable */
// Mock react-native-quick-crypto for Storybook
// Uses Node.js crypto as fallback

const crypto = require('crypto');

module.exports = {
  randomBytes: (size) => Buffer.alloc(size),
  createHash: (algorithm) => crypto.createHash(algorithm),
  pbkdf2Sync: (password, salt, iterations, keylen, digest) =>
    crypto.pbkdf2Sync(password, salt, iterations, keylen, digest),
  createCipheriv: (algorithm, key, iv) => crypto.createCipheriv(algorithm, key, iv),
  createDecipheriv: (algorithm, key, iv) => crypto.createDecipheriv(algorithm, key, iv),
  QuickCrypto: {},
  __esModule: true,
  default: {
    randomBytes: (size) => Buffer.alloc(size),
    createHash: (algorithm) => crypto.createHash(algorithm),
    pbkdf2Sync: (password, salt, iterations, keylen, digest) =>
      crypto.pbkdf2Sync(password, salt, iterations, keylen, digest),
    createCipheriv: (algorithm, key, iv) => crypto.createCipheriv(algorithm, key, iv),
    createDecipheriv: (algorithm, key, iv) => crypto.createDecipheriv(algorithm, key, iv),
  },
};
