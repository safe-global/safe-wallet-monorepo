import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isGtfSafePaid } from '../isGtfSafePaid'

const REFUND_RECEIVER = '0x0C51b4d70492D81f9f96B1EB1a826FBfb3fd27d8'

const baseData: SafeTransaction['data'] = {
  to: '0x7811208e0811341ce4E56471aEF0c1C78d83c74b',
  value: '0',
  data: '0x',
  operation: 0,
  safeTxGas: '10148',
  baseGas: '75668',
  gasPrice: '362424332',
  gasToken: ZERO_ADDRESS,
  refundReceiver: REFUND_RECEIVER,
  nonce: 15,
}

describe('isGtfSafePaid', () => {
  it('returns true when all three fee fields are set', () => {
    expect(isGtfSafePaid(baseData)).toBe(true)
  })

  it('returns false when gasPrice is zero', () => {
    expect(isGtfSafePaid({ ...baseData, gasPrice: '0' })).toBe(false)
  })

  it('returns false when baseGas is zero', () => {
    expect(isGtfSafePaid({ ...baseData, baseGas: '0' })).toBe(false)
  })

  it('returns false when refundReceiver is the zero address', () => {
    expect(isGtfSafePaid({ ...baseData, refundReceiver: ZERO_ADDRESS })).toBe(false)
  })

  it('returns false for a classic signer-pays signed payload (all three zeroed)', () => {
    expect(
      isGtfSafePaid({
        ...baseData,
        gasPrice: '0',
        baseGas: '0',
        refundReceiver: ZERO_ADDRESS,
      }),
    ).toBe(false)
  })

  it('accepts a non defined refundReceiver — check is structural, not address-specific', () => {
    expect(isGtfSafePaid({ ...baseData, refundReceiver: '0x7811208e0811341ce4E56471aEF0c1C78d83c74b' })).toBe(true)
  })

  it('returns false on missing scalars (loose CGW-shaped input)', () => {
    expect(isGtfSafePaid({ gasPrice: undefined, baseGas: '1', refundReceiver: REFUND_RECEIVER })).toBe(false)
    expect(isGtfSafePaid({ gasPrice: '1', baseGas: undefined, refundReceiver: REFUND_RECEIVER })).toBe(false)
    expect(isGtfSafePaid({ gasPrice: '1', baseGas: '1', refundReceiver: undefined })).toBe(false)
    expect(isGtfSafePaid({ gasPrice: null, baseGas: null, refundReceiver: null })).toBe(false)
  })

  it('treats lowercase zero-address as zero (case-insensitive via sameAddress)', () => {
    expect(isGtfSafePaid({ ...baseData, refundReceiver: ZERO_ADDRESS.toLowerCase() })).toBe(false)
  })
})
