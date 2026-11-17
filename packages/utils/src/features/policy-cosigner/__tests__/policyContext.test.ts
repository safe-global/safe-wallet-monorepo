import { faker } from '@faker-js/faker'
import { AbiCoder, concat, dataLength, dataSlice, getAddress, id, toBeHex, zeroPadValue } from 'ethers'
import { POLICY_CONTEXT_TYPE_HASH } from '../constants'
import { UnsupportedCosignatureError, appendPolicyContext, toPolicyContext, withPolicyContext } from '../policyContext'
import type { SafeTransaction } from '@safe-global/types-kit'

const randomAddress = () => getAddress(faker.finance.ethereumAddress())

const randomHex = (bytes: number) => faker.string.hexadecimal({ length: bytes * 2, casing: 'lower' })

const safeSignature = (r: string, s: string, v: number) => concat([r, s, toBeHex(v, 1)])

describe('policyContext', () => {
  describe('POLICY_CONTEXT_TYPE_HASH', () => {
    it('is the SafePolicyGuard.PolicyContext.v1 type hash the guard looks for', () => {
      expect(POLICY_CONTEXT_TYPE_HASH).toBe(id('SafePolicyGuard.PolicyContext.v1'))
    })
  })

  describe('appendPolicyContext', () => {
    it('appends the context, its length and the type hash after the owner signatures', () => {
      const ownerSignatures = randomHex(65)
      const context = randomHex(65)

      const result = appendPolicyContext(ownerSignatures, context)

      expect(result).toBe(concat([ownerSignatures, context, zeroPadValue(toBeHex(65), 32), POLICY_CONTEXT_TYPE_HASH]))
      expect(dataLength(result)).toBe(65 + 65 + 64)
    })

    it('returns the owner signatures unchanged when the context is empty', () => {
      const ownerSignatures = randomHex(130)

      expect(appendPolicyContext(ownerSignatures, '0x')).toBe(ownerSignatures)
    })
  })

  describe('toPolicyContext', () => {
    it.each([27, 28])('passes an ECDSA co-signature with v=%i through as the context', async (v) => {
      const signature = safeSignature(randomHex(32), randomHex(32), v)

      expect(toPolicyContext(signature)).toEqual({ context: signature, onchain: false })
    })

    it('maps an approved-hash co-signature (v=1) to an empty on-chain context', () => {
      const signer = randomAddress()
      const signature = safeSignature(zeroPadValue(signer, 32), zeroPadValue('0x', 32), 1)

      expect(toPolicyContext(signature)).toEqual({ context: '0x', onchain: true })
    })

    it('extracts the dynamic part of a contract co-signature (v=0)', () => {
      const signer = randomAddress()
      const dynamic = randomHex(97)
      const signature = concat([
        safeSignature(zeroPadValue(signer, 32), zeroPadValue(toBeHex(65), 32), 0),
        AbiCoder.defaultAbiCoder().encode(['uint256'], [dataLength(dynamic)]),
        dynamic,
      ])

      expect(toPolicyContext(signature)).toEqual({ context: dynamic, onchain: false })
    })

    it('rejects an eth_sign co-signature because the policy cannot verify it', () => {
      const signature = safeSignature(randomHex(32), randomHex(32), 31)

      expect(() => toPolicyContext(signature)).toThrow(UnsupportedCosignatureError)
    })

    it('rejects a co-signature shorter than 65 bytes', () => {
      expect(() => toPolicyContext(randomHex(64))).toThrow(UnsupportedCosignatureError)
    })

    it('rejects a contract co-signature whose offset runs past the data', () => {
      const signature = safeSignature(randomHex(32), zeroPadValue(toBeHex(500), 32), 0)

      expect(() => toPolicyContext(signature)).toThrow(UnsupportedCosignatureError)
    })
  })

  describe('withPolicyContext', () => {
    const buildSafeTx = (encoded: string): SafeTransaction => {
      const signatures = new Map()
      return {
        data: {} as SafeTransaction['data'],
        signatures,
        getSignature: (signer) => signatures.get(signer),
        addSignature: (signature) => signatures.set(signature.signer, signature),
        encodedSignatures: () => encoded,
      }
    }

    it('returns the same transaction when there is no context', () => {
      const safeTx = buildSafeTx(randomHex(65))

      expect(withPolicyContext(safeTx, undefined)).toBe(safeTx)
    })

    it('encodes the owner signatures followed by the context envelope', () => {
      const ownerSignatures = randomHex(65)
      const context = randomHex(65)

      const encoded = withPolicyContext(buildSafeTx(ownerSignatures), context).encodedSignatures()

      expect(dataSlice(encoded, 0, 65)).toBe(ownerSignatures)
      expect(dataSlice(encoded, 65, 130)).toBe(context)
    })

    it('shares the signature map with the original transaction', () => {
      const safeTx = buildSafeTx(randomHex(65))
      const signer = randomAddress()

      withPolicyContext(safeTx, randomHex(65)).addSignature({ signer } as Parameters<
        SafeTransaction['addSignature']
      >[0])

      expect(safeTx.signatures.has(signer)).toBe(true)
    })
  })
})
