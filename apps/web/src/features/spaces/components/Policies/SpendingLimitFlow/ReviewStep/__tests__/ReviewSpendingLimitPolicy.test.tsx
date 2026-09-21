import type { ReactNode } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import type Safe from '@safe-global/protocol-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { render, screen, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxContext'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { useSafeScope } from '@/components/tx-flow/safe-scope'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { useLoadFeature } from '@/features/__core__'
import useSafeInfo from '@/hooks/useSafeInfo'
import * as useChainsModule from '@/hooks/useChains'
import { tokenOptionBuilder } from '../../utils/tokenOptions.fixtures'
import useSpendingLimitTokenOptions from '../../hooks/useSpendingLimitTokenOptions'
import { useExistingSpendingLimits } from '../../ExistingSpendingLimitsProvider'
import { EXISTING_LIMITS_LOAD_ERROR, REVIEW_STEP_TITLE } from '../../constants'
import type { SpendingLimitPolicyFormValues } from '../../types'
import { UNKNOWN_TOKEN_IN_POLICY_ERROR } from '../buildSpendingLimitPairs'
import ReviewSpendingLimitPolicy from '..'

jest.mock('@/components/tx-flow/TxFlowStep', () => ({ TxFlowStep: jest.fn(({ children }) => <>{children}</>) }))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: jest.fn(({ title, children }: { title?: string; children?: ReactNode }) => (
    <div data-testid="review-transaction" data-title={title}>
      {children}
    </div>
  )),
}))
jest.mock('@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="review-skeleton" />,
}))
jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})
jest.mock('@/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))
jest.mock('@/hooks/useAddressBook', () => ({ __esModule: true, default: () => ({}) }))
jest.mock('../../hooks/useSpendingLimitSafeAccounts', () => ({
  useSpendingLimitSafeAccounts: () => ({
    accounts: [],
    isLoading: false,
    isError: false,
    hasWallet: true,
    refetch: jest.fn(),
  }),
}))
jest.mock('../../hooks/useSpendingLimitTokenOptions', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../ExistingSpendingLimitsProvider', () => ({ useExistingSpendingLimits: jest.fn() }))

const mockChain = chainBuilder().with({ chainId: '1' }).build()

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SPENDER_A = '0x1234567890123456789012345678901234567890'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const eth = tokenOptionBuilder().with({ address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18 }).build()
const usdc = tokenOptionBuilder().with({ address: USDC, symbol: 'USDC', decimals: 6 }).build()

const data: SpendingLimitPolicyFormValues = {
  safe: `1:${SAFE_A}`,
  spenders: [
    {
      address: SPENDER_A,
      limits: [
        { tokenAddress: ZERO_ADDRESS, amount: '1', resetTime: '0' },
        { tokenAddress: USDC, amount: '250', resetTime: '10080' },
      ],
    },
  ],
}

const safe = extendedSafeInfoBuilder()
  .with({ chainId: '1', address: { value: SAFE_A } })
  .build()
const sdk = {} as unknown as Safe
const scope = {
  chainId: '1',
  safeAddress: SAFE_A,
  scopeKey: `1:${SAFE_A}` as const,
  safeLoaded: true,
  safeLoading: false,
  safe,
  sdk,
}
const builtTx = { data: { to: ZERO_ADDRESS } } as unknown as SafeTransaction

const mockUseSafeScope = useSafeScope as jest.MockedFunction<typeof useSafeScope>
const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseLoadFeature = useLoadFeature as jest.Mock
const mockUseOptions = useSpendingLimitTokenOptions as jest.MockedFunction<typeof useSpendingLimitTokenOptions>
const mockUseExisting = useExistingSpendingLimits as jest.MockedFunction<typeof useExistingSpendingLimits>
const mockReviewTransaction = ReviewTransaction as jest.Mock
const mockCreate = jest.fn()
const setSafeTx = jest.fn()
const setSafeTxError = jest.fn()

const safeTxContext = (overrides: Partial<SafeTxContextParams> = {}): SafeTxContextParams => ({
  setSafeTx,
  setSafeTxError,
  setSafeMessage: jest.fn(),
  setSafeMessageHash: jest.fn(),
  setNonce: jest.fn(),
  setNonceNeeded: jest.fn(),
  setSafeTxGas: jest.fn(),
  setTxOrigin: jest.fn(),
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: jest.fn(),
  setGtfSelectedGasToken: jest.fn(),
  ...overrides,
})

const renderReview = (safeTxOverrides: Partial<SafeTxContextParams> = {}) =>
  render(
    <TxFlowContext.Provider value={{ ...initialContext, data } as TxFlowContextType}>
      <SafeTxContext.Provider value={safeTxContext(safeTxOverrides)}>
        <ReviewSpendingLimitPolicy onSubmit={jest.fn()}>
          <div data-testid="flow-children" />
        </ReviewSpendingLimitPolicy>
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )

const optionsResult = (options: (typeof eth)[], isLoading = false) => ({
  options,
  isLoading,
  isError: false,
  refetch: jest.fn(),
  isPopularLoading: false,
  isPopularError: false,
  refetchPopular: jest.fn(),
  identityKey: `1:${SAFE_A}`,
})

describe('ReviewSpendingLimitPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // A spy on the real module, not `jest.mock`, because `useChains`/`useChainId` import each other: a
    // factory that spreads `jest.requireActual('@/hooks/useChains')` hits that circularity as soon as
    // this file's own (unmocked) import of `TxFlowProvider` pulls in the real wallet chain, which also
    // requires `useChains` — leaving `useChainId`'s own copy of the module without a working default
    // export. Spying leaves the real, working module in place for every other export.
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(mockChain)
    mockUseSafeScope.mockReturnValue(scope)
    mockUseSafeInfo.mockReturnValue({ safe, safeAddress: SAFE_A, safeLoaded: true, safeLoading: false })
    mockUseLoadFeature.mockReturnValue({ $isReady: true, $isDisabled: false, createSpendingLimitsTx: mockCreate })
    mockUseOptions.mockReturnValue(optionsResult([eth, usdc]))
    mockUseExisting.mockReturnValue({ limits: [], loading: false })
    mockCreate.mockResolvedValue(builtTx)
  })

  it('titles the step "Confirm policy"', () => {
    expect(REVIEW_STEP_TITLE).toBe('Confirm policy')
  })

  it('shows the skeleton under the Confirm policy title with the nonce hidden until the transaction exists', () => {
    renderReview()

    expect(screen.getByTestId('review-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('review-transaction')).not.toBeInTheDocument()
    expect(TxFlowStep).toHaveBeenCalledWith(
      expect.objectContaining({ title: REVIEW_STEP_TITLE, hideNonce: true }),
      undefined,
    )
  })

  it('builds the multisend from every row with its token decimals and the selected Safe, then hands it to the flow', async () => {
    renderReview()

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith(
      [
        { beneficiary: SPENDER_A, tokenAddress: ZERO_ADDRESS, amount: '1', decimals: 18, resetTime: '0' },
        { beneficiary: SPENDER_A, tokenAddress: USDC, amount: '250', decimals: 6, resetTime: '10080' },
      ],
      [],
      '1',
      mockChain,
      safe.modules,
      safe.deployed,
      scope,
    )
    expect(setSafeTxError).toHaveBeenCalledWith(undefined)
  })

  it('waits for the token options, the Safe and the existing limits before building', () => {
    mockUseOptions.mockReturnValue(optionsResult([eth, usdc], true))
    renderReview()
    expect(mockCreate).not.toHaveBeenCalled()

    mockUseOptions.mockReturnValue(optionsResult([eth, usdc]))
    mockUseSafeInfo.mockReturnValue({ safe, safeAddress: SAFE_A, safeLoaded: false, safeLoading: true })
    renderReview()
    expect(mockCreate).not.toHaveBeenCalled()

    mockUseSafeInfo.mockReturnValue({ safe, safeAddress: SAFE_A, safeLoaded: true, safeLoading: false })
    mockUseExisting.mockReturnValue({ loading: true })
    renderReview()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('reports a token it cannot resolve instead of building', async () => {
    mockUseOptions.mockReturnValue(optionsResult([eth]))

    renderReview()

    await waitFor(() =>
      expect(setSafeTxError).toHaveBeenCalledWith(expect.objectContaining({ message: UNKNOWN_TOKEN_IN_POLICY_ERROR })),
    )
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('reports a failed existing-limits load instead of building blind', async () => {
    mockUseExisting.mockReturnValue({ loading: false, error: new Error('rpc down') })

    renderReview()

    await waitFor(() =>
      expect(setSafeTxError).toHaveBeenCalledWith(expect.objectContaining({ message: EXISTING_LIMITS_LOAD_ERROR })),
    )
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('surfaces a builder failure through the flow', async () => {
    const failure = new Error('no module')
    mockCreate.mockRejectedValue(failure)

    renderReview()

    await waitFor(() => expect(setSafeTxError).toHaveBeenCalledWith(failure))
  })

  it('renders the summary first inside the shared review once the transaction exists, with the flow children', () => {
    renderReview({ safeTx: builtTx })

    const review = screen.getByTestId('review-transaction')
    expect(review).toHaveAttribute('data-title', REVIEW_STEP_TITLE)
    expect(mockReviewTransaction).toHaveBeenCalledWith(expect.objectContaining({ title: REVIEW_STEP_TITLE }), undefined)
    const summary = screen.getByTestId('spending-limit-summary')
    expect(review.firstElementChild).toBe(summary)
    expect(screen.getByTestId('spending-limit-summary-applies-to')).toHaveTextContent(shortenAddress(SAFE_A))
    expect(screen.getByTestId('spending-limit-summary-spender')).toHaveTextContent(SPENDER_A)
    expect(screen.getByTestId('flow-children')).toBeInTheDocument()
    expect(screen.queryByTestId('review-skeleton')).not.toBeInTheDocument()
  })

  it('shows the shared review when the build failed, so it can display the error', () => {
    renderReview({ safeTxError: new Error('no module') })

    expect(screen.getByTestId('review-transaction')).toBeInTheDocument()
    expect(screen.queryByTestId('review-skeleton')).not.toBeInTheDocument()
  })
})
