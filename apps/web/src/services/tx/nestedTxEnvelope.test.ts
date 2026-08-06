import { concat, dataSlice, getAddress, keccak256, toBeHex, toUtf8Bytes } from 'ethers'
import {
  APPROVE_HASH_SELECTOR,
  NESTED_TX_MAGIC,
  type NestedTxEnvelope,
  decodeNestedTxPayload,
  deriveEnvelopeSafeTxHash,
  encodeNestedTxPayload,
  splitApproveHashCalldata,
  verifyAndStripNestedTxCalldata,
  verifyNestedTxPayload,
} from './nestedTxEnvelope'

const CHILD_SAFE = getAddress(toBeHex('0xdef', 20))
const PARENT_SAFE = getAddress(toBeHex('0xabc', 20))
const RECIPIENT = getAddress(toBeHex('0x123', 20))
const ZERO_ADDRESS = getAddress(toBeHex('0x0', 20))

const childEnvelope: NestedTxEnvelope = {
  chainId: '1',
  safe: CHILD_SAFE,
  nonce: 7,
  to: RECIPIENT,
  value: '1000000000000000000',
  data: '0xabcdef',
  operation: 0,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: ZERO_ADDRESS,
  refundReceiver: ZERO_ADDRESS,
}

const buildApproveHashCalldata = (approvedHash: string, payload = '0x'): string =>
  concat([APPROVE_HASH_SELECTOR, approvedHash, payload])

describe('nestedTxEnvelope', () => {
  it('magic constant equals bytes4(keccak256("SafeNestedChildTxV1"))', () => {
    expect(NESTED_TX_MAGIC).toBe(dataSlice(keccak256(toUtf8Bytes('SafeNestedChildTxV1')), 0, 4))
    expect(NESTED_TX_MAGIC).toBe('0xfb4e87b0')
  })

  describe('encode/decode round-trip', () => {
    it('round-trips a single envelope', () => {
      const payload = encodeNestedTxPayload([childEnvelope])

      expect(payload.startsWith(NESTED_TX_MAGIC)).toBe(true)
      expect(decodeNestedTxPayload(payload)).toEqual([childEnvelope])
    })

    it('round-trips a multi-entry list preserving order', () => {
      const outer: NestedTxEnvelope = {
        ...childEnvelope,
        safe: PARENT_SAFE,
        nonce: 1,
        data: concat([APPROVE_HASH_SELECTOR, deriveEnvelopeSafeTxHash(childEnvelope)]),
        value: '0',
      }

      expect(decodeNestedTxPayload(encodeNestedTxPayload([outer, childEnvelope]))).toEqual([outer, childEnvelope])
    })
  })

  describe('decodeNestedTxPayload', () => {
    it('returns null without the magic prefix', () => {
      const payload = encodeNestedTxPayload([childEnvelope])
      expect(decodeNestedTxPayload('0xdeadbeef' + payload.slice(10))).toBeNull()
    })

    it('returns null for a truncated payload', () => {
      const payload = encodeNestedTxPayload([childEnvelope])
      expect(decodeNestedTxPayload(payload.slice(0, payload.length - 64))).toBeNull()
    })

    it('returns null for garbage after the magic', () => {
      expect(decodeNestedTxPayload(concat([NESTED_TX_MAGIC, '0x1234']))).toBeNull()
    })

    it('returns null for non-hex input and an empty list', () => {
      expect(decodeNestedTxPayload('not hex')).toBeNull()
      expect(decodeNestedTxPayload(encodeNestedTxPayload([]))).toBeNull()
    })
  })

  describe('splitApproveHashCalldata', () => {
    it('returns the payload for calldata with trailing bytes', () => {
      const hash = keccak256('0x01')
      const payload = encodeNestedTxPayload([childEnvelope])

      expect(splitApproveHashCalldata(buildApproveHashCalldata(hash, payload))).toEqual({
        approvedHash: hash,
        payload,
      })
    })

    it('returns payload 0x for plain 36-byte approveHash calldata', () => {
      const hash = keccak256('0x01')

      expect(splitApproveHashCalldata(buildApproveHashCalldata(hash))).toEqual({
        approvedHash: hash,
        payload: '0x',
      })
    })

    it('returns null for other selectors, short calldata, and non-hex data', () => {
      expect(splitApproveHashCalldata('0xdeadbeef' + keccak256('0x01').slice(2))).toBeNull()
      expect(splitApproveHashCalldata(APPROVE_HASH_SELECTOR)).toBeNull()
      expect(splitApproveHashCalldata(concat([APPROVE_HASH_SELECTOR, '0x1234']))).toBeNull()
      expect(splitApproveHashCalldata('not hex')).toBeNull()
    })
  })

  describe('verifyNestedTxPayload', () => {
    it('verifies a payload whose first envelope derives the approved hash', () => {
      const approvedHash = deriveEnvelopeSafeTxHash(childEnvelope)
      const payload = encodeNestedTxPayload([childEnvelope])

      expect(verifyNestedTxPayload(approvedHash, payload)).toEqual([childEnvelope])
    })

    it('fails when the value is tampered by 1 wei', () => {
      const approvedHash = deriveEnvelopeSafeTxHash(childEnvelope)
      const tampered = { ...childEnvelope, value: '1000000000000000001' }

      expect(verifyNestedTxPayload(approvedHash, encodeNestedTxPayload([tampered]))).toBeNull()
    })

    it('fails when the nonce is tampered', () => {
      const approvedHash = deriveEnvelopeSafeTxHash(childEnvelope)
      const tampered = { ...childEnvelope, nonce: childEnvelope.nonce + 1 }

      expect(verifyNestedTxPayload(approvedHash, encodeNestedTxPayload([tampered]))).toBeNull()
    })

    it('verifies a 2-entry chain where E0.data approves derive(E1)', () => {
      const innerHash = deriveEnvelopeSafeTxHash(childEnvelope)
      const outer: NestedTxEnvelope = {
        ...childEnvelope,
        safe: PARENT_SAFE,
        to: CHILD_SAFE,
        nonce: 1,
        value: '0',
        data: concat([APPROVE_HASH_SELECTOR, innerHash]),
      }
      const approvedHash = deriveEnvelopeSafeTxHash(outer)

      expect(verifyNestedTxPayload(approvedHash, encodeNestedTxPayload([outer, childEnvelope]))).toEqual([
        outer,
        childEnvelope,
      ])
    })

    it('fails a 2-entry chain with a broken link', () => {
      const outer: NestedTxEnvelope = {
        ...childEnvelope,
        safe: PARENT_SAFE,
        to: CHILD_SAFE,
        nonce: 1,
        value: '0',
        // Approves a different hash than derive(childEnvelope)
        data: concat([APPROVE_HASH_SELECTOR, keccak256('0x02')]),
      }
      const approvedHash = deriveEnvelopeSafeTxHash(outer)

      expect(verifyNestedTxPayload(approvedHash, encodeNestedTxPayload([outer, childEnvelope]))).toBeNull()
    })

    it('fails for a malformed payload', () => {
      expect(verifyNestedTxPayload(keccak256('0x01'), '0x1234')).toBeNull()
    })
  })

  describe('verifyAndStripNestedTxCalldata', () => {
    it('passes non-approveHash data through unchanged', () => {
      expect(verifyAndStripNestedTxCalldata('0xdeadbeef')).toEqual({ data: '0xdeadbeef' })
    })

    it('passes plain 36-byte approveHash calldata through unchanged', () => {
      const data = buildApproveHashCalldata(keccak256('0x01'))
      expect(verifyAndStripNestedTxCalldata(data)).toEqual({ data })
    })

    it('passes calldata with unknown trailing bytes through unchanged', () => {
      const data = buildApproveHashCalldata(keccak256('0x01'), '0x001122')
      expect(verifyAndStripNestedTxCalldata(data)).toEqual({ data })
    })

    it('throws when the payload decodes but does not match the approved hash', () => {
      const data = buildApproveHashCalldata(keccak256('0x01'), encodeNestedTxPayload([childEnvelope]))

      expect(() => verifyAndStripNestedTxCalldata(data)).toThrow(
        'Nested transaction payload does not match the approved hash',
      )
    })

    it('strips a verified envelope and returns the innermost child tx', () => {
      const approvedHash = deriveEnvelopeSafeTxHash(childEnvelope)
      const data = buildApproveHashCalldata(approvedHash, encodeNestedTxPayload([childEnvelope]))

      expect(verifyAndStripNestedTxCalldata(data)).toEqual({
        data: buildApproveHashCalldata(approvedHash),
        childTx: childEnvelope,
      })
    })
  })
})
