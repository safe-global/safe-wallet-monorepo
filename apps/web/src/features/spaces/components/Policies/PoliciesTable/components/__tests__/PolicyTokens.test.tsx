import { render, screen, within } from '@/tests/test-utils'
import {
  MOCK_TOKENS,
  asActivePolicy,
  mockMultiSpenderPolicy,
  mockProposerPolicy,
  mockSpendingLimitPolicy,
} from '../../../mocks/policies'
import type { PolicyTokenInfo } from '../../../types'
import PolicyTokens from '../PolicyTokens'

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const DAI: PolicyTokenInfo = {
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  symbol: 'DAI',
  decimals: 18,
  logoUri: null,
}

const withTokens = (tokens: PolicyTokenInfo[]) =>
  asActivePolicy(
    mockSpendingLimitPolicy({
      data: {
        spenders: [
          {
            spender: '0x0000000000000000000000000000000000000A11',
            allowances: tokens.map((token) => ({
              token,
              amount: '1000',
              spent: '0',
              remaining: '1000',
              resetPeriodMinutes: 1440,
              resetsAtMinute: 0,
              createdAt: 0,
            })),
          },
        ],
      },
    }),
  )

describe('PolicyTokens', () => {
  it('should, when the policy is a proposer grant, render nothing', () => {
    const { container } = render(<PolicyTokens policy={asActivePolicy(mockProposerPolicy())} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should list every token symbol in the tooltip', () => {
    render(<PolicyTokens policy={asActivePolicy(mockMultiSpenderPolicy())} />)

    const tooltip = screen.getByTestId('policy-tokens-tooltip')

    expect(within(tooltip).getByText('USDC')).toBeInTheDocument()
    expect(within(tooltip).getByText('USDT')).toBeInTheDocument()
    expect(within(tooltip).getByText('UNKNOWN')).toBeInTheDocument()
  })

  it('should list the overflowing tokens in the tooltip too', () => {
    render(<PolicyTokens policy={withTokens([MOCK_TOKENS.usdc, MOCK_TOKENS.usdt, MOCK_TOKENS.unknown, DAI])} />)

    expect(screen.getByTestId('policy-tokens')).toHaveTextContent('+1')
    expect(within(screen.getByTestId('policy-tokens-tooltip')).getByText('DAI')).toBeInTheDocument()
  })

  it('should not show an overflow count when every token is visible', () => {
    render(<PolicyTokens policy={withTokens([MOCK_TOKENS.usdc, MOCK_TOKENS.usdt])} />)

    expect(screen.getByTestId('policy-tokens')).not.toHaveTextContent('+')
  })
})
