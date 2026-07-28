import { type H2COpts, hash_to_field } from '@noble/curves/abstract/hash-to-curve'
import { secp256k1 } from '@noble/curves/secp256k1'
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils'
import { sha256 } from '@noble/hashes/sha2'

/**
 * RFC-9591 FROST(secp256k1, SHA-256) hash-to-field helpers, ported from
 * `repos/safenet/validator/src/frost/hashes.ts`. `h2` is the challenge hash used
 * by signature verification; `h1`/`h3`/`h4`/`h5` are included so the known-answer
 * tests from the protocol repo can pin the full hash port.
 */

const N = secp256k1.Point.CURVE().n
const CONTEXT = 'FROST-secp256k1-SHA256-v1'

const dst = (discriminant: string): string => CONTEXT + discriminant

const opts = (discriminant: string): H2COpts => ({
  m: 1,
  p: N,
  k: 128,
  expand: 'xmd',
  hash: sha256,
  DST: dst(discriminant),
})

export const h1 = (input: Uint8Array): bigint => hash_to_field(input, 1, opts('rho'))[0][0]

export const h2 = (input: Uint8Array): bigint => hash_to_field(input, 1, opts('chal'))[0][0]

export const h3 = (input: Uint8Array): bigint => hash_to_field(input, 1, opts('nonce'))[0][0]

export const h4 = (input: Uint8Array): Uint8Array => sha256(concatBytes(utf8ToBytes(dst('msg')), input))

export const h5 = (input: Uint8Array): Uint8Array => sha256(concatBytes(utf8ToBytes(dst('com')), input))
