import { useState, type ReactNode } from 'react'
import { act } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import { renderHook } from '@/tests/test-utils'
import { useFeesPreview } from '../useFeesPreview'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import * as useGasLimitModule from '@/hooks/useGasLimit'
import * as useGasPriceModule from '@/hooks/useGasPrice'
import * as useChainsModule from '@/hooks/useChains'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as useBalancesModule from '@/hooks/useBalances'
import * as useGasTokenCandidatesModule from '../useGasTokenCandidates'
import * as gatewayApi from '@/store/api/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { SafeTransaction, SafeTransactionData } from '@safe-global/types-kit'

const mockChain = chainBuilder()
  .with({ chainId: '1', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'https://eth.logo' } })
  .build()

const mockSafe = extendedSafeInfoBuilder().with({ threshold: 2 }).build()

const buildSafeTx = (
  data: Partial<SafeTransactionData>,
  signatures: Map<string, unknown> = new Map(),
): SafeTransaction =>
  ({
    data: {
      to: mockSafe.address.value,
      value: '0',
      data: '0x',
      operation: 0,
      nonce: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      ...data,
    },
    signatures,
  }) as unknown as SafeTransaction

// ERC-20 transfer(0x38D48FaDa993b749691E93e4E62259c488bCb766, 4500000000000000) — 0.0045 WETH
const WETH_TRANSFER_CALLDATA =
  '0xa9059cbb00000000000000000000000038d48fada993b749691e93e4e62259c488bcb766000000000000000000000000000000000000000000000000000ffcb9e57d4000'

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

const nativeSafeTx = buildSafeTx({
  to: mockSafe.address.value,
  value: '100000000000000', // 0.0001 ETH
  data: '0x',
})

const erc20SafeTx = buildSafeTx({
  to: WETH_ADDRESS,
  value: '0',
  data: WETH_TRANSFER_CALLDATA,
})

const buildBalances = (items: unknown[] = []): ReturnType<typeof useBalancesModule.default> => ({
  balances: { fiatTotal: '1000', items: items as never },
  loaded: true,
  loading: false,
})

const nativeBalance = {
  balance: '1000000000000000000',
  fiatBalance: '2500',
  fiatConversion: '2500', // 1 ETH = $2500
  tokenInfo: {
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logoUri: 'https://eth.logo',
    name: 'Ether',
    symbol: 'ETH',
    type: 'NATIVE_TOKEN',
  },
}

const wethBalance = {
  balance: '10000000000000000',
  fiatBalance: '25',
  fiatConversion: '2500',
  tokenInfo: {
    address: WETH_ADDRESS,
    decimals: 18,
    logoUri: 'https://weth.logo',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    type: 'ERC20',
  },
}

const mockSuccessfulPreview = {
  data: {
    txData: {
      chainId: '1',
      safeAddress: mockSafe.address.value,
      safeTxGas: '2409',
      baseGas: '68568',
      gasPrice: '741064438',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      numberSignatures: 2,
    },
    relayCost: { fiatCode: 'USD', fiatValue: '0.12410833692950203' },
    pricingContextSnapshot: {
      phase: 2,
      priceSource: 'COINGECKO',
      priceTimestamp: 1776428854,
      gasPriceVolatilityBuffer: 1.3,
    },
  },
  isLoading: false,
  isFetching: false,
  error: undefined,
  refetch: jest.fn(),
} as unknown as ReturnType<typeof gatewayApi.useGetGtfFeePreviewQuery>

const emptyPreview = {
  data: undefined,
  isLoading: false,
  isFetching: false,
  error: undefined,
  refetch: jest.fn(),
} as unknown as ReturnType<typeof gatewayApi.useGetGtfFeePreviewQuery>

const loadingPreview = {
  data: undefined,
  isLoading: true,
  isFetching: true,
  error: undefined,
  refetch: jest.fn(),
} as unknown as ReturnType<typeof gatewayApi.useGetGtfFeePreviewQuery>

const withSafeTx = (safeTx: SafeTransaction | undefined, gtfPaymentMode: 'safe' | 'signer' = 'safe') => {
  const SafeTxWrapper = ({ children }: { children: ReactNode }) => {
    const [gtfSelectedGasToken, setGtfSelectedGasToken] = useState<string | undefined>(undefined)
    return (
      <SafeTxContext.Provider
        value={
          {
            safeTx,
            setSafeTx: jest.fn(),
            setSafeMessage: jest.fn(),
            setSafeMessageHash: jest.fn(),
            setSafeTxError: jest.fn(),
            setNonce: jest.fn(),
            setNonceNeeded: jest.fn(),
            setSafeTxGas: jest.fn(),
            setTxOrigin: jest.fn(),
            gtfPaymentMode,
            setGtfPaymentMode: jest.fn(),
            gtfSelectedGasToken,
            setGtfSelectedGasToken,
            isReadOnly: false,
          } as never
        }
      >
        {children}
      </SafeTxContext.Provider>
    )
  }
  return SafeTxWrapper
}

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000'

const candidateEth = {
  address: ETH_ADDRESS,
  symbol: 'ETH',
  logoUri: 'https://eth.logo',
  decimals: 18,
  fiatBalance: '2500',
}

const candidateWeth = {
  address: WETH_ADDRESS,
  symbol: 'WETH',
  logoUri: 'https://weth.logo',
  decimals: 18,
  fiatBalance: '25',
}

describe('useFeesPreview', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(mockChain)
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeLoaded: true,
      safeLoading: false,
    })
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([nativeBalance, wethBalance]))
    jest.spyOn(useGasTokenCandidatesModule, 'useGasTokenCandidates').mockReturnValue({
      candidates: [candidateEth, candidateWeth],
      defaultAddress: ETH_ADDRESS,
    })
    jest.spyOn(useGasLimitModule, 'default').mockReturnValue({ gasLimit: BigInt(21000), gasLimitLoading: false })
    jest
      .spyOn(useGasPriceModule, 'default')
      .mockReturnValue([{ maxFeePerGas: BigInt(20000000000), maxPriorityFeePerGas: undefined }, undefined, false])
  })

  it('returns execution fee as FREE with no amount/currency/percentage label', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(result.current.executionFee).toEqual({ label: 'Execution fee', isFree: true })
    expect(result.current.executionFee.amount).toBeUndefined()
    expect(result.current.executionFee.currency).toBeUndefined()
  })

  it('maps a successful preview response to gasFee amount + fiat (canCoverFees = true)', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(result.current.canCoverFees).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.gasFee.currency).toBe('ETH')
    expect(result.current.gasFee.amount).toMatch(/^0\.00005/)
    expect(result.current.gasFee.fiatAmount).toBeDefined()
  })

  it('computes single-currency totalOutgoing for native transfer (send + gas in ETH)', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(result.current.totalOutgoing).toBeDefined()
    expect(result.current.totalOutgoing?.primary[0].currency).toBe('ETH')
    // 0.0001 ETH send + ~0.0000526 ETH gas ≈ 0.0001526 ETH
    expect(result.current.totalOutgoing?.primary[0].amount).toMatch(/^0\.00015/)
    expect(result.current.totalOutgoing?.fees).toBeUndefined()
    expect(result.current.totalOutgoing?.fiatTotal).toBeDefined()
  })

  it('computes two-currency totalOutgoing for ERC-20 transfer (send in token, gas in ETH)', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(erc20SafeTx) })

    expect(result.current.totalOutgoing).toBeDefined()
    expect(result.current.totalOutgoing?.primary).toEqual([{ amount: '0.0045', currency: 'WETH' }])
    expect(result.current.totalOutgoing?.fees?.currency).toBe('ETH')
    expect(result.current.totalOutgoing?.fees?.amount).toMatch(/^0\.00005/)
    expect(result.current.totalOutgoing?.fiatTotal).toBeDefined()
  })

  it('omits totalOutgoing for non-transfer safeTx (e.g. contract call with no value and no transfer selector)', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)
    const contractCall = buildSafeTx({ to: mockSafe.address.value, value: '0', data: '0xdeadbeef' })

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(contractCall) })

    expect(result.current.totalOutgoing).toBeUndefined()
  })

  it('renders totalOutgoing as gas-only for a reject-shape safeTx (value=0, data=0x)', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)
    const rejectTx = buildSafeTx({ to: mockSafe.address.value, value: '0', data: '0x' })

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(rejectTx) })

    expect(result.current.totalOutgoing).toBeDefined()
    expect(result.current.totalOutgoing?.primary[0].currency).toBe('ETH')
    // gasWei = (2409 + 68568) * 741064438 ≈ 5.26e13 → ~0.00005 ETH
    expect(result.current.totalOutgoing?.primary[0].amount).toMatch(/^0\.00005/)
    expect(result.current.totalOutgoing?.fees).toBeUndefined()
    expect(result.current.totalOutgoing?.fiatTotal).toBeDefined()
  })

  it('exposes candidates as availableGasTokens and defaults selection to defaultAddress', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(result.current.availableGasTokens).toEqual([candidateEth, candidateWeth])
    expect(result.current.selectedGasToken).toBe(ETH_ADDRESS)
  })

  it('updates selectedGasToken when onGasTokenChange is called, and preview re-fires with new gasToken', () => {
    const previewSpy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(result.current.selectedGasToken).toBe(ETH_ADDRESS)

    act(() => {
      result.current.onGasTokenChange?.(WETH_ADDRESS)
    })

    expect(result.current.selectedGasToken).toBe(WETH_ADDRESS)
    const lastCallArg = previewSpy.mock.calls.at(-1)?.[0]
    expect(lastCallArg).toMatchObject({ tx: expect.objectContaining({ gasToken: WETH_ADDRESS }) })
  })

  it('renders gas fee in the selected gas token symbol (WETH) when user picks a non-native token', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    act(() => {
      result.current.onGasTokenChange?.(WETH_ADDRESS)
    })

    expect(result.current.gasFee.currency).toBe('WETH')
  })

  it('forgets user selection when the token drops out of candidates', () => {
    const spy = jest.spyOn(useGasTokenCandidatesModule, 'useGasTokenCandidates').mockReturnValue({
      candidates: [candidateEth, candidateWeth],
      defaultAddress: ETH_ADDRESS,
    })
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

    const { result, rerender } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    act(() => {
      result.current.onGasTokenChange?.(WETH_ADDRESS)
    })
    expect(result.current.selectedGasToken).toBe(WETH_ADDRESS)

    // WETH balance drops to zero — no longer a candidate
    spy.mockReturnValue({
      candidates: [candidateEth],
      defaultAddress: ETH_ADDRESS,
    })
    rerender()

    expect(result.current.selectedGasToken).toBe(ETH_ADDRESS)
  })

  it('preserves user selection across a transient empty-candidates render', () => {
    // Simulates Back/Forward between flow steps: useGasTokenCandidates re-mounts and reports
    // an empty candidates list for one tick before the new probes resolve. The cleanup must NOT
    // wipe the persisted selection during that window.
    const spy = jest.spyOn(useGasTokenCandidatesModule, 'useGasTokenCandidates').mockReturnValue({
      candidates: [candidateEth, candidateWeth],
      defaultAddress: ETH_ADDRESS,
    })
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

    const { result, rerender } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    act(() => {
      result.current.onGasTokenChange?.(WETH_ADDRESS)
    })
    expect(result.current.selectedGasToken).toBe(WETH_ADDRESS)

    // Empty candidates window — user navigated Back, balances not yet repopulated
    spy.mockReturnValue({ candidates: [], defaultAddress: undefined })
    rerender()
    expect(result.current.selectedGasToken).toBe(WETH_ADDRESS)

    // Candidates repopulated with WETH still usable — selection unchanged
    spy.mockReturnValue({
      candidates: [candidateEth, candidateWeth],
      defaultAddress: ETH_ADDRESS,
    })
    rerender()
    expect(result.current.selectedGasToken).toBe(WETH_ADDRESS)
  })

  it('falls back to ZERO_ADDRESS when there is no default and no user selection', () => {
    jest.spyOn(useGasTokenCandidatesModule, 'useGasTokenCandidates').mockReturnValue({
      candidates: [],
      defaultAddress: undefined,
    })
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(result.current.selectedGasToken).toBe(ETH_ADDRESS)
    expect(result.current.availableGasTokens).toEqual([])
  })

  it('returns loading state while preview is fetching', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(loadingPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(result.current.loading).toBe(true)
    expect(result.current.canCoverFees).toBe(true)
  })

  it('shows "Calculated at execution" when preview is unavailable on a multi-sig Safe (PLA-1465)', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(result.current.canCoverFees).toBe(false)
    expect(result.current.gasFee.note).toBe('Calculated at execution')
    expect(result.current.gasFee.amount).toBeUndefined()
    expect(result.current.gasFee.currency).toBeUndefined()
    expect(result.current.error).toBe(false)
    expect(result.current.totalOutgoing).toBeUndefined()
  })

  it('falls back to local gas estimation for single-signer Safes when preview is unavailable', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)
    const singleSignerSafe = extendedSafeInfoBuilder().with({ threshold: 1 }).build()
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      safe: singleSignerSafe,
      safeAddress: singleSignerSafe.address.value,
      safeLoaded: true,
      safeLoading: false,
    })

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(result.current.canCoverFees).toBe(false)
    expect(result.current.gasFee.amount).toBeDefined()
    expect(result.current.gasFee.currency).toBe('ETH')
  })

  it('skips the preview query and routes to signer-pays when no Safe-side gas tokens are available', () => {
    jest.spyOn(useGasTokenCandidatesModule, 'useGasTokenCandidates').mockReturnValue({
      candidates: [],
      defaultAddress: undefined,
    })
    const previewSpy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx) })

    expect(previewSpy.mock.calls.at(-1)?.[0]).toBe(skipToken)
    expect(result.current.canCoverFees).toBe(true)
    expect(result.current.availableGasTokens).toEqual([])
    expect(result.current.gasFee.note).toBe('Calculated at execution')
  })

  describe('signer-pays mode (Safe→Signer toggle)', () => {
    it('skips the CGW preview query in Signer mode', () => {
      const previewSpy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)

      renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx, 'signer') })

      expect(previewSpy.mock.calls.at(-1)?.[0]).toBe(skipToken)
    })

    it('shows "Calculated at execution" note for multi-signer Safes (executor unknown at sign time)', () => {
      jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx, 'signer') })

      expect(result.current.gasFee.note).toBe('Calculated at execution')
      expect(result.current.gasFee.amount).toBeUndefined()
      expect(result.current.gasFee.currency).toBeUndefined()
      expect(result.current.canCoverFees).toBe(true)
    })

    it('uses the local EOA gas estimate for single-signer Safes', () => {
      jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)
      const singleSignerSafe = extendedSafeInfoBuilder().with({ threshold: 1 }).build()
      jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
        safe: singleSignerSafe,
        safeAddress: singleSignerSafe.address.value,
        safeLoaded: true,
        safeLoading: false,
      })

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(nativeSafeTx, 'signer') })

      expect(result.current.gasFee.note).toBeUndefined()
      expect(result.current.gasFee.amount).toBeDefined()
      expect(result.current.gasFee.currency).toBe('ETH')
      expect(result.current.canCoverFees).toBe(true)
    })
  })

  it('falls back to ETH when chain is unavailable (single-signer Safe)', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(undefined)
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)
    const singleSignerSafe = extendedSafeInfoBuilder().with({ threshold: 1 }).build()
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      safe: singleSignerSafe,
      safeAddress: singleSignerSafe.address.value,
      safeLoaded: true,
      safeLoading: false,
    })

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(undefined) })

    expect(result.current.gasFee.currency).toBe('ETH')
  })

  describe('confirmation flow (second signer)', () => {
    // GTF Safe-pays fingerprint: baseGas/gasPrice non-zero AND refundReceiver != ZERO_ADDRESS.
    const SAFE_PAYS = {
      safeTxGas: '2409',
      baseGas: '68568',
      gasPrice: '741064438',
      refundReceiver: '0xc918e75504D1B0c741Eb4236B72Dae7A52401E95',
    }

    const signedNativeSafeTx = buildSafeTx(
      { to: mockSafe.address.value, value: '100000000000000', data: '0x', gasToken: ETH_ADDRESS, ...SAFE_PAYS },
      new Map([['0xSigner', {}]]),
    )

    const signedWethGasSafeTx = buildSafeTx(
      { to: mockSafe.address.value, value: '100000000000000', data: '0x', gasToken: WETH_ADDRESS, ...SAFE_PAYS },
      new Map([['0xSigner', {}]]),
    )

    it('marks isConfirmation and locks the gas token from safeTx.data.gasToken', () => {
      jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedWethGasSafeTx) })

      expect(result.current.isConfirmation).toBe(true)
      expect(result.current.selectedGasToken).toBe(WETH_ADDRESS)
      expect(result.current.onGasTokenChange).toBeUndefined()
    })

    it('exposes only the locked token in availableGasTokens, resolved from balances', () => {
      jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedWethGasSafeTx) })

      expect(result.current.availableGasTokens).toEqual([
        expect.objectContaining({ address: WETH_ADDRESS, symbol: 'WETH', logoUri: 'https://weth.logo' }),
      ])
    })

    it('resolves native metadata from the chain when gasToken is the zero address', () => {
      jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedNativeSafeTx) })

      expect(result.current.availableGasTokens).toEqual([
        expect.objectContaining({ address: ETH_ADDRESS, symbol: 'ETH', logoUri: 'https://eth.logo' }),
      ])
    })

    it('skips the CGW preview query — confirmers derive fees from the signed payload', () => {
      const previewSpy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)

      renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedWethGasSafeTx) })

      expect(previewSpy.mock.calls.at(-1)?.[0]).toBe(skipToken)
    })

    it('derives gasFee amount + fiat from the signed safeTx.data (not CGW)', () => {
      jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)
      const lockedSafeTx = buildSafeTx(
        {
          to: mockSafe.address.value,
          value: '100000000000000',
          data: '0x',
          gasToken: ETH_ADDRESS,
          ...SAFE_PAYS,
        },
        new Map([['0xSigner', {}]]),
      )

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(lockedSafeTx) })

      // gasWei = (2409 + 68568) * 741064438 ≈ 5.26e13 → ~0.00005 ETH
      expect(result.current.gasFee.currency).toBe('ETH')
      expect(result.current.gasFee.amount).toMatch(/^0\.00005/)
      // fiat = gasWei in ETH * fiatConversion (2500) → ~$0.13
      expect(result.current.gasFee.fiatAmount).toBeDefined()
      expect(result.current.loading).toBe(false)
      expect(result.current.canCoverFees).toBe(true)
    })

    it('renders totalOutgoing as gas-only for a reject-shape signed safeTx with native gas', () => {
      jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)
      const lockedReject = buildSafeTx(
        {
          to: mockSafe.address.value,
          value: '0',
          data: '0x',
          gasToken: ETH_ADDRESS,
          ...SAFE_PAYS,
        },
        new Map([['0xSigner', {}]]),
      )

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(lockedReject) })

      expect(result.current.totalOutgoing).toBeDefined()
      expect(result.current.totalOutgoing?.primary[0].currency).toBe('ETH')
      expect(result.current.totalOutgoing?.primary[0].amount).toMatch(/^0\.00005/)
      expect(result.current.totalOutgoing?.fees).toBeUndefined()
    })

    it('locks the UI as legacy-signed for a signed Signer-pays tx (gasToken=0x0, baseGas=0)', () => {
      jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(mockSuccessfulPreview)
      // Signer-pays signed tx: gasPrice/baseGas are zero and refundReceiver is ZERO_ADDRESS, so
      // it's not a Safe-pays confirmer. The hook locks the UI anyway (no editable selectors)
      // and surfaces "Calculated at execution" — same as a pre-M2 queue item.
      const signedSignerPaysTx = buildSafeTx(
        { to: mockSafe.address.value, value: '100000000000000', data: '0x', gasToken: ETH_ADDRESS },
        new Map([['0xSigner', {}]]),
      )

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedSignerPaysTx) })

      expect(result.current.isLegacySigned).toBe(true)
      expect(result.current.isConfirmation).toBe(true)
      expect(result.current.gasFee.note).toBe('Calculated at execution')
      expect(result.current.gasFee.amount).toBeUndefined()
    })

    it('renders totalOutgoing in the locked ERC-20 gas token for a reject-shape signed safeTx', () => {
      jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(emptyPreview)
      const lockedRejectWeth = buildSafeTx(
        {
          to: mockSafe.address.value,
          value: '0',
          data: '0x',
          gasToken: WETH_ADDRESS,
          ...SAFE_PAYS,
        },
        new Map([['0xSigner', {}]]),
      )

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(lockedRejectWeth) })

      expect(result.current.totalOutgoing).toBeDefined()
      expect(result.current.totalOutgoing?.primary[0].currency).toBe('WETH')
      expect(result.current.totalOutgoing?.fees).toBeUndefined()
    })
  })
})
