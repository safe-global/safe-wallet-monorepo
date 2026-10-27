import { faker } from '@faker-js/faker'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import type { PolicyAllowance } from '@safe-global/views/features/spaces/components/Policies/types'
import type { RecipientAllowlistFlowData } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import { useSpendingLimitImpacts } from '../../hooks/useSpendingLimitImpacts'
import type { SpendingLimitImpact } from '../../utils/spendingLimitImpacts'
import ExistingPoliciesStep from '..'

jest.mock('../../hooks/useSpendingLimitImpacts', () => ({ useSpendingLimitImpacts: jest.fn() }))
jest.mock('../../hooks/useRecipientAllowlistSafeAccounts', () => ({
  useRecipientAllowlistSafeAccounts: () => ({ accounts: [] }),
}))
jest.mock('@/hooks/useAllAddressBooks', () => ({
  ContactSource: { space: 'space', local: 'local' },
  useMergedAddressBooks: () => ({ get: () => undefined }),
}))

const mockImpacts = useSpendingLimitImpacts as jest.MockedFunction<typeof useSpendingLimitImpacts>

const makeAllowance = (symbol: string): PolicyAllowance => ({
  token: { address: faker.finance.ethereumAddress(), symbol, decimals: 6, logoUri: null },
  amount: '500000000',
  spent: '0',
  remaining: '500000000',
  resetPeriodMinutes: 1_440,
  resetsAtMinute: null,
})

const makeImpact = (symbol: string, restricted: boolean): SpendingLimitImpact => ({
  spender: faker.finance.ethereumAddress(),
  allowance: makeAllowance(symbol),
  restricted,
  recipients: restricted ? [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()] : [],
})

const data: RecipientAllowlistFlowData = { excludedTokens: [], addedTokens: [], recipients: [], rules: [] }

const renderStep = () => {
  const onNext = jest.fn()
  const view = renderWithUserEvent(
    <TxFlowContext.Provider value={{ ...initialContext, data, onNext }}>
      <ExistingPoliciesStep />
    </TxFlowContext.Provider>,
  )

  return { ...view, onNext }
}

describe('ExistingPoliciesStep', () => {
  beforeEach(() => {
    mockImpacts.mockReturnValue([makeImpact('USDC', true), makeImpact('ETH', false)])
  })

  it('warns how many spending limits the allowlist restricts', () => {
    renderStep()

    expect(screen.getByText('1 spending limit will be restricted by this allowlist.')).toBeInTheDocument()
  })

  it('shows a restricted limit with what it can send today and after, and leaves the other unaffected', () => {
    renderStep()

    expect(screen.getByText('Will be restricted')).toBeInTheDocument()
    expect(screen.getByText('USDC to any address, up to 500/day')).toBeInTheDocument()
    expect(screen.getByText('USDC only to the 2 allowed recipients, up to 500/day')).toBeInTheDocument()
    expect(screen.getByText('Not affected')).toBeInTheDocument()
    expect(screen.getByText("500/day · ETH isn't in this allowlist")).toBeInTheDocument()
  })

  it('keeps Next disabled until the restriction is acknowledged', async () => {
    const { user, onNext } = renderStep()
    const next = screen.getByTestId('next-btn')

    expect(next).toBeDisabled()
    await user.click(screen.getByRole('checkbox'))
    expect(next).toBeEnabled()
    await user.click(next)

    expect(onNext).toHaveBeenCalledWith(data)
  })
})
