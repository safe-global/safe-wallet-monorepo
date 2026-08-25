import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { assertTrustedRefundReceiver, isTrustedFeeCollector } from '../assertTrustedRefundReceiver'
import { FEE_COLLECTORS } from '../constants'

const CHAIN_ID = '137'
const TRUSTED = FEE_COLLECTORS[0]
const ATTACKER = '0x7811208e0811341ce4E56471aEF0c1C78d83c74b'

const safePaid = {
  gasPrice: '443094379592',
  baseGas: '79646',
  refundReceiver: TRUSTED,
}

describe('isTrustedFeeCollector', () => {
  it('matches an allowlisted collector', () => {
    expect(isTrustedFeeCollector(TRUSTED)).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(isTrustedFeeCollector(TRUSTED.toLowerCase())).toBe(true)
  })

  it('rejects any other address', () => {
    expect(isTrustedFeeCollector(ATTACKER)).toBe(false)
  })

  it('rejects missing values', () => {
    expect(isTrustedFeeCollector(undefined)).toBe(false)
    expect(isTrustedFeeCollector(null)).toBe(false)
    expect(isTrustedFeeCollector('')).toBe(false)
  })
})

describe('assertTrustedRefundReceiver', () => {
  it('passes a Safe-paid tx refunding an allowlisted collector', () => {
    expect(() => assertTrustedRefundReceiver(safePaid, CHAIN_ID)).not.toThrow()
  })

  it('passes when the collector casing differs from the allowlist', () => {
    expect(() =>
      assertTrustedRefundReceiver({ ...safePaid, refundReceiver: TRUSTED.toLowerCase() }, CHAIN_ID),
    ).not.toThrow()
  })

  it('throws on a Safe-paid tx refunding an untrusted address', () => {
    expect(() => assertTrustedRefundReceiver({ ...safePaid, refundReceiver: ATTACKER }, CHAIN_ID)).toThrow(
      `Untrusted gas-fee recipient ${ATTACKER} returned by CGW on chain ${CHAIN_ID}. Refusing to proceed.`,
    )
  })

  it('ignores signer-pays txs regardless of refundReceiver', () => {
    expect(() =>
      assertTrustedRefundReceiver({ ...safePaid, gasPrice: '0', refundReceiver: ATTACKER }, CHAIN_ID),
    ).not.toThrow()
    expect(() =>
      assertTrustedRefundReceiver({ ...safePaid, baseGas: '0', refundReceiver: ATTACKER }, CHAIN_ID),
    ).not.toThrow()
    expect(() => assertTrustedRefundReceiver({ ...safePaid, refundReceiver: ZERO_ADDRESS }, CHAIN_ID)).not.toThrow()
  })

  it('ignores loose CGW payloads missing the fee scalars', () => {
    expect(() => assertTrustedRefundReceiver({}, CHAIN_ID)).not.toThrow()
    expect(() =>
      assertTrustedRefundReceiver({ gasPrice: null, baseGas: null, refundReceiver: null }, CHAIN_ID),
    ).not.toThrow()
    expect(() => assertTrustedRefundReceiver({ gasPrice: '1', refundReceiver: ATTACKER }, CHAIN_ID)).not.toThrow()
  })
})
