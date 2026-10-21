import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import type { Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { render, screen, waitFor } from '@/tests/test-utils'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import * as useBalances from '@/hooks/useBalances'
import * as useChainId from '@/hooks/useChainId'
import * as useChains from '@/hooks/useChains'
import { balanceBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import { chainBuilder } from '@/tests/builders/chains'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { safeTxContextBuilder } from '@/tests/builders/safeTxContext'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { createNewSpendingLimitTx } from '../../services/spendingLimitExecution'
import type { NewSpendingLimitFlowProps, SpendingLimitState } from '../../types'
import ReviewSpendingLimit from '.'

const MAINNET = '1'
const ONE_DAY_IN_MINUTES = '1440'
const ONE_WEEK_IN_MINUTES = '10080'
const ONE_USDC = '1000000'

jest.mock('../../services/spendingLimitExecution', () => ({ createNewSpendingLimitTx: jest.fn() }))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const mockCreateNewSpendingLimitTx = jest.mocked(createNewSpendingLimitTx)
const builtTx = safeTxBuilder().build()
const usdc = erc20TokenBuilder().with({ symbol: 'USDC', decimals: 6 }).build()

const newLimit: NewSpendingLimitFlowProps = {
  beneficiary: checksumAddress(faker.finance.ethereumAddress()),
  tokenAddress: usdc.address,
  amount: '1.5',
  resetTime: ONE_DAY_IN_MINUTES,
}

const existingLimit = (): SpendingLimitState =>
  spendingLimitStateBuilder()
    .with({ beneficiary: newLimit.beneficiary, token: usdc, amount: ONE_USDC, resetTimeMin: ONE_WEEK_IN_MINUTES })
    .build()

const givenSafeHolds = (tokens: Erc20Token[]) => {
  jest.spyOn(useBalances, 'default').mockReturnValue({
    balances: { items: tokens.map((tokenInfo) => balanceBuilder().with({ tokenInfo }).build()), fiatTotal: '0' },
    loaded: true,
    loading: false,
    error: undefined,
  })
}

const renderReview = (spendingLimits: SpendingLimitState[] = []) => {
  const context = safeTxContextBuilder().build()
  const txFlow: TxFlowContextType<NewSpendingLimitFlowProps> = { ...initialContext, data: newLimit }
  render(
    <SafeTxContext.Provider value={context}>
      <TxFlowContext.Provider value={txFlow}>
        <ReviewSpendingLimit onSubmit={jest.fn()} />
      </TxFlowContext.Provider>
    </SafeTxContext.Provider>,
    { initialReduxState: { spendingLimits: { data: spendingLimits, loaded: true, loading: false } } },
  )
  return context
}

describe('ReviewSpendingLimit', () => {
  beforeEach(() => {
    jest.spyOn(useChainId, 'default').mockReturnValue(MAINNET)
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ chainId: MAINNET }).build())
    givenSafeHolds([usdc])
    mockCreateNewSpendingLimitTx.mockResolvedValue(builtTx)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    mockCreateNewSpendingLimitTx.mockReset()
  })

  it('shows the amount, beneficiary and reset time of a new limit', () => {
    renderReview()

    expect(screen.getByTestId('token-amount').textContent).toBe('1.5')
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByTestId('beneficiary-address')).toHaveTextContent(newLimit.beneficiary)
    expect(screen.getByText('1 day')).toBeInTheDocument()
    expect(screen.queryByTestId('limit-replacement-warning')).not.toBeInTheDocument()
  })

  it('warns and shows the old amount and reset time when it replaces an existing limit', () => {
    renderReview([existingLimit()])

    expect(screen.getByTestId('limit-replacement-warning')).toBeInTheDocument()
    expect(screen.getByTestId('old-token-amount').textContent).toBe('1')
    expect(screen.getByTestId('old-reset-time').textContent).toBe('1 week')
    expect(screen.getByText('1 day')).toBeInTheDocument()
  })

  it('builds the spending limit transaction', async () => {
    const context = renderReview()

    await waitFor(() => expect(context.setSafeTx).toHaveBeenCalledWith(builtTx))
  })

  it('waits for the token decimals before it builds the transaction', () => {
    givenSafeHolds([])

    renderReview()

    expect(mockCreateNewSpendingLimitTx).not.toHaveBeenCalled()
  })
})
