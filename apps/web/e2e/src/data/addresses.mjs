import { Wallet } from 'ethers'

// Mirrors DEFAULT_ANCHOR_SIMILARITY_CONFIG in packages/utils/src/utils/addressSimilarity.types.ts
const AFFIX_LENGTH = 4

const affixes = (address) => {
  const hex = address.toLowerCase().replace(/^0x/, '')
  return { prefix: hex.slice(0, AFFIX_LENGTH), suffix: hex.slice(-AFFIX_LENGTH) }
}

/**
 * A random address that shares neither its first nor its last 4 hex characters with any of `anchors`,
 * so Safe Shield never flags it as an address-poisoning look-alike of a Safe or contact the wallet knows.
 *
 * @param {Iterable<string>} anchors - Addresses the wallet trusts: Safes in the accounts, address book contacts
 * @param {() => string} [createAddress] - Source of random addresses
 * @returns {string}
 */
export function randomAddressUnlike(anchors, createAddress = () => Wallet.createRandom().address) {
  const taken = [...anchors].map(affixes)
  for (;;) {
    const address = createAddress()
    const { prefix, suffix } = affixes(address)
    if (taken.every((anchor) => anchor.prefix !== prefix && anchor.suffix !== suffix)) return address
  }
}
