import { faker } from '@faker-js/faker'
import { RESTRICTED_SPENDING_LIMITS_DESCRIPTION } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import type { PolicyAllowance } from '@safe-global/views/features/spaces/components/Policies/types'
import type { RecipientAllowlistFlowData } from '../../types'
import { useSpendingLimitImpacts } from '../../hooks/useSpendingLimitImpacts'
import type { SpendingLimitImpact, SpendingLimitImpactKind } from '../../utils/spendingLimitImpacts'
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

const makeImpact = (symbol: string, impact: SpendingLimitImpactKind): SpendingLimitImpact => ({
  spender: faker.finance.ethereumAddress(),
  allowance: makeAllowance(symbol),
  impact,
  recipients: impact === 'restricted' ? [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()] : [],
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
    mockImpacts.mockReturnValue([makeImpact('USDC', 'restricted'), makeImpact('ETH', 'unaffected')])
  })

  it('should say the spending limit follows the rules, when the Safe has one restricted limit', () => {
    mockImpacts.mockReturnValue([makeImpact('USDC', 'restricted')])
    renderStep()

    expect(screen.getByText("Your spending limit will follow this allowlist's rules.")).toBeInTheDocument()
    expect(screen.getByText(RESTRICTED_SPENDING_LIMITS_DESCRIPTION)).toBeInTheDocument()
  })

  it('should count the restricted limits out of all of them, when only some are restricted', () => {
    renderStep()

    expect(screen.getByText("1 of your 2 spending limits will follow this allowlist's rules.")).toBeInTheDocument()
    expect(screen.getByText(RESTRICTED_SPENDING_LIMITS_DESCRIPTION)).toBeInTheDocument()
  })

  it('should say all spending limits follow the rules, when every limit is restricted', () => {
    mockImpacts.mockReturnValue([makeImpact('USDC', 'restricted'), makeImpact('DAI', 'restricted')])
    renderStep()

    expect(screen.getByText("Your 2 spending limits will follow this allowlist's rules.")).toBeInTheDocument()
  })

  it('should list every limit and mark only the restricted one, when only some are restricted', () => {
    renderStep()

    expect(screen.getAllByTestId('spending-limit-impact')).toHaveLength(2)
    expect(screen.getByText('Will be restricted')).toBeInTheDocument()
    expect(screen.queryByText('Will be blocked')).not.toBeInTheDocument()
    expect(screen.getByText('500/day · USDC is in this allowlist')).toBeInTheDocument()
    expect(screen.getByText("500/day · ETH isn't in this allowlist")).toBeInTheDocument()
  })

  it('keeps Next disabled until the change is acknowledged', async () => {
    const { user, onNext } = renderStep()
    const next = screen.getByTestId('next-btn')

    expect(screen.getByText('I understand how this allowlist changes these spending limits.')).toBeInTheDocument()
    expect(next).toBeDisabled()
    await user.click(screen.getByRole('checkbox'))
    expect(next).toBeEnabled()
    await user.click(next)

    expect(onNext).toHaveBeenCalledWith(data)
  })
})
