import { buildFeesBreakdown, type TokenMeta } from './feeRows'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const ZERO = '0x0000000000000000000000000000000000000000'
const REFUND_RECEIVER = '0x0C51b4d70492D81f9f96B1EB1a826FBfb3fd27d8'
const USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'

const NATIVE: TokenMeta = { address: ZERO, symbol: 'MATIC', decimals: 18 }

// Real staging Polygon Safe-pays fixture (native gas token).
const SAFE_PAYS_NATIVE: MultisigExecutionDetails = {
  type: 'MULTISIG',
  safeTxGas: '12936',
  baseGas: '79646',
  gasPrice: '443094379592',
  gasToken: ZERO,
  refundReceiver: { value: REFUND_RECEIVER },
} as unknown as MultisigExecutionDetails

// (12936 + 79646) * 443094379592
const EXPECTED_NATIVE_GAS_WEI = '41022563851386544'

describe('buildFeesBreakdown', () => {
  describe('Safe-pays (native gas token)', () => {
    it('never flags Safe-pays gas as not yet known (gas price is fixed in the payload)', () => {
      const result = buildFeesBreakdown({ detailedExecutionInfo: SAFE_PAYS_NATIVE, nativeCurrency: NATIVE })
      expect(result.gasNotYetKnown).toBe(false)
    })

    it('computes the deterministic gas fee in the native currency', () => {
      const result = buildFeesBreakdown({ detailedExecutionInfo: SAFE_PAYS_NATIVE, nativeCurrency: NATIVE })

      expect(result.paidFromSafe).toBe(true)
      expect(result.maxGasFee).toEqual({
        amount: EXPECTED_NATIVE_GAS_WEI,
        symbol: 'MATIC',
        decimals: 18,
        address: ZERO,
      })
    })

    it('derives the fiat value from the balances conversion rate', () => {
      const balances: Balances = {
        fiatTotal: '0',
        items: [{ balance: '0', fiatBalance: '0', fiatConversion: '0.5', tokenInfo: { address: ZERO } } as never],
      }

      const result = buildFeesBreakdown({ detailedExecutionInfo: SAFE_PAYS_NATIVE, nativeCurrency: NATIVE, balances })

      // 0.041022563851386544 MATIC * 0.5 ≈ 0.0205
      expect(result.maxGasFeeFiat).toBeCloseTo(0.0205112819, 8)
    })

    it('leaves fiat undefined when no conversion rate is available', () => {
      const result = buildFeesBreakdown({ detailedExecutionInfo: SAFE_PAYS_NATIVE, nativeCurrency: NATIVE })
      expect(result.maxGasFeeFiat).toBeUndefined()
    })
  })

  describe('Safe-pays (ERC-20 gas token)', () => {
    const SAFE_PAYS_USDC: MultisigExecutionDetails = {
      type: 'MULTISIG',
      safeTxGas: '0',
      baseGas: '1000000',
      gasPrice: '1',
      gasToken: USDC,
      gasTokenInfo: { address: USDC, symbol: 'USDC', decimals: 6, type: 'ERC20' },
      refundReceiver: { value: REFUND_RECEIVER },
    } as unknown as MultisigExecutionDetails

    it('denominates the gas fee in the gas token', () => {
      const result = buildFeesBreakdown({ detailedExecutionInfo: SAFE_PAYS_USDC, nativeCurrency: NATIVE })

      expect(result.paidFromSafe).toBe(true)
      expect(result.maxGasFee).toEqual({ amount: '1000000', symbol: 'USDC', decimals: 6, address: USDC })
    })
  })

  describe('signer-pays (non-GTF)', () => {
    const SIGNER_PAYS: MultisigExecutionDetails = {
      type: 'MULTISIG',
      safeTxGas: '21000',
      baseGas: '0',
      gasPrice: '0',
      gasToken: ZERO,
      refundReceiver: { value: ZERO },
    } as unknown as MultisigExecutionDetails

    it('is not Safe-pays and the fee is in the native currency', () => {
      const result = buildFeesBreakdown({ detailedExecutionInfo: SIGNER_PAYS, nativeCurrency: NATIVE })
      expect(result.paidFromSafe).toBe(false)
      expect(result.maxGasFee.symbol).toBe('MATIC')
    })

    it('flags the gas fee as not yet known when the gas price is zero', () => {
      const result = buildFeesBreakdown({ detailedExecutionInfo: SIGNER_PAYS, nativeCurrency: NATIVE })
      expect(result.gasNotYetKnown).toBe(true)
    })

    it('does not flag gas as unknown once a gas price is set', () => {
      const withGasPrice = { ...SIGNER_PAYS, gasPrice: '443094379592' } as unknown as MultisigExecutionDetails
      const result = buildFeesBreakdown({ detailedExecutionInfo: withGasPrice, nativeCurrency: NATIVE })
      expect(result.gasNotYetKnown).toBe(false)
    })
  })

  describe('Total outgoing', () => {
    it('shows a single summed line when the transfer and gas use the same token', () => {
      const result = buildFeesBreakdown({
        detailedExecutionInfo: SAFE_PAYS_NATIVE,
        nativeCurrency: NATIVE,
        outgoing: { amount: '1000000000000000000', symbol: 'MATIC', decimals: 18, address: ZERO },
      })

      expect(result.totalOutgoing).toHaveLength(1)
      expect(result.totalOutgoing[0].amount).toBe((1000000000000000000n + BigInt(EXPECTED_NATIVE_GAS_WEI)).toString())
    })

    it('shows two currencies when the transfer token differs from the gas token', () => {
      const result = buildFeesBreakdown({
        detailedExecutionInfo: SAFE_PAYS_NATIVE,
        nativeCurrency: NATIVE,
        outgoing: { amount: '5000000', symbol: 'USDC', decimals: 6, address: USDC },
      })

      expect(result.totalOutgoing).toHaveLength(2)
      expect(result.totalOutgoing.map((line) => line.symbol)).toEqual(['USDC', 'MATIC'])
    })

    it('falls back to the gas fee line when there is no outgoing transfer', () => {
      const result = buildFeesBreakdown({ detailedExecutionInfo: SAFE_PAYS_NATIVE, nativeCurrency: NATIVE })
      expect(result.totalOutgoing).toEqual([result.maxGasFee])
    })
  })
})
