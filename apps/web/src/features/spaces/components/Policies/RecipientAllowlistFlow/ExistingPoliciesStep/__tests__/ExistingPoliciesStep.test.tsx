import { faker } from '@faker-js/faker'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  BLOCKED_SPENDING_LIMITS_DESCRIPTION,
  RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
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
    mockImpacts.mockReturnValue([makeImpact('USDC', 'restricted'), makeImpact('ETH', 'blocked')])
  })

  it('warns that the one spending limit on a left-out token will be blocked, naming what it can send today', () => {
    const blocked = makeImpact('ETH', 'blocked')
    mockImpacts.mockReturnValue([makeImpact('USDC', 'restricted'), blocked])
    renderStep()

    expect(screen.getByText('1 spending limit will be blocked by this allowlist.')).toBeInTheDocument()
    expect(
      screen.getByText(
        `${shortenAddress(blocked.spender)} can send up to 500 ETH / day to any address today. Once this allowlist is active, it can't send ETH anymore.`,
      ),
    ).toBeInTheDocument()
  })

  it('keeps the banner general when several spending limits will be blocked', () => {
    mockImpacts.mockReturnValue([makeImpact('ETH', 'blocked'), makeImpact('DAI', 'blocked')])
    renderStep()

    expect(screen.getByText('2 spending limits will be blocked by this allowlist.')).toBeInTheDocument()
    expect(screen.getByText(BLOCKED_SPENDING_LIMITS_DESCRIPTION)).toBeInTheDocument()
  })

  it.each([
    [1, "Your spending limit will follow this allowlist's rules."],
    [2, "Your 2 spending limits will follow this allowlist's rules."],
  ])('says %s restricted spending limits follow the rules when none is blocked', (count, title) => {
    mockImpacts.mockReturnValue(Array.from({ length: count }, () => makeImpact('USDC', 'restricted')))
    renderStep()

    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByText(RESTRICTED_SPENDING_LIMITS_DESCRIPTION)).toBeInTheDocument()
  })

  it('marks each limit as blocked or restricted', () => {
    renderStep()

    expect(screen.getByText('Will be restricted')).toBeInTheDocument()
    expect(screen.getByText('Will be blocked')).toBeInTheDocument()
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
