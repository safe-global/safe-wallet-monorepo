import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomAddressUnlike } from './addresses.mjs'

const SAFE = '0x7a740d2F836094E0c56D14C3bAB6c3CE31dC911d'

const sequence = (...addresses) => {
  const queue = [...addresses]
  return () => queue.shift()
}

test('skips an address whose last 4 characters match an anchor, in any case', () => {
  const lookAlike = '0xe45384356464aa925cEF2BC7aae812D559EC911D'
  const unlike = '0x1111111111111111111111111111111111112222'

  assert.equal(randomAddressUnlike([SAFE], sequence(lookAlike, unlike)), unlike)
})

test('skips an address whose first 4 characters match an anchor', () => {
  const lookAlike = '0x7A74000000000000000000000000000000000001'
  const unlike = '0x1111111111111111111111111111111111112222'

  assert.equal(randomAddressUnlike([SAFE], sequence(lookAlike, unlike)), unlike)
})

test('returns the first address when nothing is anchored', () => {
  const first = '0x7a74000000000000000000000000000000c911d0'

  assert.equal(randomAddressUnlike([], sequence(first)), first)
})

test('creates a random address by default', () => {
  assert.match(randomAddressUnlike([SAFE]), /^0x[0-9a-fA-F]{40}$/)
})
