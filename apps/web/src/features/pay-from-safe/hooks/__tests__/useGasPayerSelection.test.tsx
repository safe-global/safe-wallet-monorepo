import { useContext, useState, type ReactNode } from 'react'
import { act, renderHook } from '@/tests/test-utils'
import { createMockSafeTransaction } from '@/tests/transactions'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { getStoreInstance } from '@/store'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { feePaymentSourcePreferenceSlice } from '../../store'
import type { FeePaymentMode } from '../../types'
import { useGasPayerSelection } from '../useGasPayerSelection'
import type { FeesPreviewData } from '../useFeesPreview'

const SIGNER = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'

const mockUseWallet = jest.fn<ConnectedWallet | null, []>()
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '11155111', nativeCurrency: { symbol: 'ETH', decimals: 18 } }),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { threshold: 1 }, safeAddress: '0xSafe' }),
}))

jest.mock('../../utils/isPayFromSafeAvailable', () => ({
  isPayFromSafeAvailable: () => true,
}))

const mockUseSafeSponsoredTxs = jest.fn()
jest.mock('@/features/spaces', () => ({
  useSafeSponsoredTxs: () => mockUseSafeSponsoredTxs(),
}))

const NATIVE = { address: ZERO_ADDRESS, symbol: 'ETH', logoUri: '' }
const mockUseFeesPreview = jest.fn<FeesPreviewData, []>()
jest.mock('../useFeesPreview', () => ({
  useFeesPreview: () => mockUseFeesPreview(),
}))

const mockUsePayFromSafeFeePreview = jest.fn()
jest.mock('../usePayFromSafeFeePreview', () => ({
  usePayFromSafeFeePreview: (args: { enabled: boolean }) => mockUsePayFromSafeFeePreview(args),
}))

const QUOTE = {
  data: {
    txData: { safeTxGas: '12983', baseGas: '72094', gasPrice: '1000000000', gasToken: ZERO_ADDRESS },
    relayCost: { fiatValue: '0.2', fiatCode: 'USD' },
  },
  isLoading: false,
  isFetching: false,
  error: undefined,
}

const buildFees = (overrides: Partial<FeesPreviewData> = {}): FeesPreviewData => ({
  canCoverFees: true,
  executionFee: { label: 'Execution fee', isFree: true },
  gasFee: { label: 'Gas fee', amount: '0.00001', currency: 'ETH' },
  availableGasTokens: [NATIVE],
  selectedGasToken: ZERO_ADDRESS,
  ...overrides,
})

const preference = (mode: FeePaymentMode) => ({
  initialReduxState: { [feePaymentSourcePreferenceSlice.name]: { [SIGNER.toLowerCase()]: mode } },
})

/** Holds the flow's payment mode the way SafeTxProvider does, so the hook's sync is observable. */
let currentMode: FeePaymentMode | undefined
const ModeProvider = ({ children }: { children: ReactNode }) => {
  const defaults = useContext(SafeTxContext)
  const [feePaymentMode, setFeePaymentMode] = useState<FeePaymentMode>('signer')
  currentMode = feePaymentMode
  return (
    <SafeTxContext.Provider value={{ ...defaults, feePaymentMode, setFeePaymentMode }}>
      {children}
    </SafeTxContext.Provider>
  )
}

const unsignedTx = createMockSafeTransaction({ to: '0x1', data: '0x', value: '1' })

const renderSelection = (options?: ReturnType<typeof preference>) =>
  renderHook(() => useGasPayerSelection({ safeTx: unsignedTx, offer: null, step: 'sign' }), {
    wrapper: ModeProvider,
    ...options,
  })

const persisted = () => getStoreInstance().getState()[feePaymentSourcePreferenceSlice.name]

describe('useGasPayerSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // The preference slice is persisted to localStorage, which would carry picks across tests
    localStorage.clear()
    currentMode = undefined
    mockUseWallet.mockReturnValue({ address: SIGNER } as unknown as ConnectedWallet)
    mockUseSafeSponsoredTxs.mockReturnValue({ isPro: false, left: undefined, meter: undefined })
    mockUseFeesPreview.mockReturnValue(buildFees())
    // Mirrors RTK Query: a skipped query has no data, no error and is not loading
    mockUsePayFromSafeFeePreview.mockImplementation(({ enabled }: { enabled: boolean }) =>
      enabled ? QUOTE : { data: undefined, error: undefined, isLoading: false, isFetching: false },
    )
  })

  const quoteRequested = () => mockUsePayFromSafeFeePreview.mock.calls.some(([args]) => args.enabled)

  it('defaults to Signer wallet when nothing is remembered', () => {
    const { result } = renderSelection()

    expect(result.current.choice).toBe('WALLET')
    expect(result.current.view?.payer).toEqual({
      kind: 'choice',
      value: 'WALLET',
      options: ['PAY_FROM_SAFE', 'WALLET'],
    })
    expect(currentMode).toBe('signer')
    // The selector falls back to its signer-pays explanation
    expect(result.current.view?.gasToken.lockedReason).toBeUndefined()
  })

  it('starts on Safe account when the signer picked it last time', () => {
    const { result } = renderSelection(preference('safe'))

    expect(result.current.choice).toBe('PAY_FROM_SAFE')
    expect(currentMode).toBe('safe')
  })

  it('starts on Signer wallet when the signer picked it last time', () => {
    const { result } = renderSelection(preference('signer'))

    expect(result.current.choice).toBe('WALLET')
    expect(currentMode).toBe('signer')
  })

  it('remembers a Safe account pick', () => {
    const { result } = renderSelection()

    act(() => result.current.setChoice('PAY_FROM_SAFE'))

    expect(result.current.choice).toBe('PAY_FROM_SAFE')
    expect(currentMode).toBe('safe')
    expect(persisted()).toEqual({ [SIGNER.toLowerCase()]: 'safe' })
  })

  it('remembers a Signer wallet pick', () => {
    const { result } = renderSelection(preference('safe'))

    act(() => result.current.setChoice('WALLET'))

    expect(result.current.choice).toBe('WALLET')
    expect(currentMode).toBe('signer')
    expect(persisted()).toEqual({ [SIGNER.toLowerCase()]: 'signer' })
  })

  it('falls back to Signer wallet without forgetting Safe account while the Safe cannot pay', () => {
    mockUseFeesPreview.mockReturnValue(buildFees({ availableGasTokens: [] }))

    const { result, rerender } = renderSelection(preference('safe'))

    expect(result.current.choice).toBe('WALLET')
    expect(currentMode).toBe('signer')
    expect(persisted()).toEqual({ [SIGNER.toLowerCase()]: 'safe' })

    mockUseFeesPreview.mockReturnValue(buildFees())
    rerender()

    expect(result.current.choice).toBe('PAY_FROM_SAFE')
    expect(currentMode).toBe('safe')
  })

  it('ignores a remembered Safe account pick for a Pro Workspace with sponsored transactions left', () => {
    mockUseSafeSponsoredTxs.mockReturnValue({ isPro: true, left: 10, meter: { quota: 50, resetsAt: null } })

    const { result } = renderSelection(preference('safe'))

    expect(result.current.choice).toBe('WALLET')
    expect(result.current.view?.payer).toEqual({ kind: 'locked', value: 'SPONSORED' })
    expect(result.current.view?.gasToken.lockedReason).toBe('Covered by your sponsored transactions.')
    expect(currentMode).toBe('signer')
  })

  it('does not remember a pick when no wallet is connected', () => {
    mockUseWallet.mockReturnValue(null)
    const { result } = renderSelection()

    act(() => result.current.setChoice('PAY_FROM_SAFE'))

    expect(result.current.choice).toBe('PAY_FROM_SAFE')
    expect(persisted()).toEqual({})
  })
  it('does not request a quote while Signer wallet is chosen', () => {
    const { result } = renderSelection()

    expect(result.current.choice).toBe('WALLET')
    expect(quoteRequested()).toBe(false)
  })

  it('requests the quote once Safe account is chosen', () => {
    const { result } = renderSelection()

    act(() => result.current.setChoice('PAY_FROM_SAFE'))

    expect(quoteRequested()).toBe(true)
    expect(result.current.view?.gasFee).toEqual(expect.objectContaining({ currency: 'ETH' }))
    expect(result.current.hasQuoteError).toBe(false)
  })

  it('holds the CTA while the Safe account quote loads', () => {
    mockUsePayFromSafeFeePreview.mockImplementation(({ enabled }: { enabled: boolean }) => ({
      data: undefined,
      error: undefined,
      isLoading: enabled,
      isFetching: enabled,
    }))

    const { result } = renderSelection(preference('safe'))

    expect(result.current.isQuoteLoading).toBe(true)
    expect(result.current.view?.gasFee).toEqual({ loading: true })
  })

  it('flags a failed Safe account quote instead of falling back to signer-pays', () => {
    mockUsePayFromSafeFeePreview.mockImplementation(({ enabled }: { enabled: boolean }) => ({
      data: undefined,
      error: enabled ? { status: 500 } : undefined,
      isLoading: false,
      isFetching: false,
    }))

    const { result } = renderSelection(preference('safe'))

    expect(result.current.choice).toBe('PAY_FROM_SAFE')
    expect(result.current.hasQuoteError).toBe(true)
    expect(result.current.view?.gasFee).toEqual({ error: true })
  })

  it('does not flag a quote error while Signer wallet is chosen', () => {
    mockUsePayFromSafeFeePreview.mockReturnValue({
      data: undefined,
      error: { status: 500 },
      isLoading: false,
      isFetching: false,
    })

    const { result } = renderSelection()

    expect(result.current.hasQuoteError).toBe(false)
  })
  it('keeps Safe account and the failed quote when the fees preview falls back', () => {
    mockUsePayFromSafeFeePreview.mockImplementation(({ enabled }: { enabled: boolean }) => ({
      data: undefined,
      error: enabled ? { status: 500 } : undefined,
      isLoading: false,
      isFetching: false,
    }))
    // `useFeesPreview` reports it cannot cover fees once its own preview fails
    mockUseFeesPreview.mockReturnValue(buildFees({ canCoverFees: false }))

    const { result, rerender } = renderSelection(preference('safe'))
    rerender()

    expect(result.current.choice).toBe('PAY_FROM_SAFE')
    expect(result.current.hasQuoteError).toBe(true)
    expect(currentMode).toBe('safe')
    expect(mockUsePayFromSafeFeePreview.mock.calls.every(([args]) => args.enabled)).toBe(true)
  })
  describe('sponsor at execution', () => {
    const signedTx = createMockSafeTransaction({ to: '0x1', data: '0x', value: '1' })
    signedTx.addSignature({ signer: SIGNER, data: '0x1234', staticPart: () => '0x', dynamicPart: () => '' } as never)

    const renderExecution = (offer: Parameters<typeof useGasPayerSelection>[0]['offer']) =>
      renderHook(() => useGasPayerSelection({ safeTx: signedTx, offer, step: 'execute' }), { wrapper: ModeProvider })

    it('is the plan for a Pro Workspace', () => {
      mockUseSafeSponsoredTxs.mockReturnValue({ isPro: true, left: 49, meter: { quota: 50, resetsAt: null } })
      const { result } = renderExecution({ option: 'SUBSCRIPTION', left: 49, spaceId: '1' } as never)

      expect(result.current.choice).toBe('SPONSORED')
      expect(result.current.view?.sponsorKind).toBe('plan')
    })

    it("is the chain's free transactions for a Safe outside a Workspace", () => {
      const { result } = renderExecution({ option: 'FREE_DAILY_LIMIT', relays: { remaining: 1, limit: 5 } } as never)

      expect(result.current.choice).toBe('SPONSORED')
      expect(result.current.view?.sponsorKind).toBe('free')
      expect(result.current.view?.footer).toEqual(expect.objectContaining({ kind: 'counter', isSubscription: false }))
    })
  })
})
