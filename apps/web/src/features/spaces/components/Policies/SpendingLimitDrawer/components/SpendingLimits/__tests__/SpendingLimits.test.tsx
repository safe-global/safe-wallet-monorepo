import { render, screen, within } from '@/tests/test-utils'
import { MOCK_ADDRESSES, mockMultiSpenderPolicy, mockSpendingLimitPolicy } from '../../../../mocks/policies'
import SpendingLimits from '../SpendingLimits'

const { spenders } = mockSpendingLimitPolicy().data

describe('SpendingLimits', () => {
  it('shows each token with its amount and period', () => {
    render(<SpendingLimits spenders={spenders} showUsage />)

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('1,500/month')).toBeInTheDocument()
    expect(screen.getByText('USDT')).toBeInTheDocument()
    expect(screen.getByText('1,000/month')).toBeInTheDocument()
  })

  it('shows remaining amount, a progress bar and the reset time when active', () => {
    render(<SpendingLimits spenders={spenders} showUsage />)

    expect(screen.getByText('500 USDC remaining')).toBeInTheDocument()
    // Both allowances share the fixture's default resetsAtMinute, so the reset line renders twice.
    expect(screen.getAllByText('Resets Oct 1, 00:00 UTC')).toHaveLength(2)
    expect(screen.getAllByRole('progressbar')).toHaveLength(2)
  })

  // Nothing is enforced until the transaction executes, so a bar would imply a measured zero.
  it('shows no usage at all when the policy is pending', () => {
    render(<SpendingLimits spenders={spenders} showUsage={false} />)

    expect(screen.getByText('1,500/month')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Resets/)).not.toBeInTheDocument()
  })

  it('repeats the spender block, each with its own tokens', () => {
    render(<SpendingLimits spenders={mockMultiSpenderPolicy().data.spenders} showUsage />)

    const cards = screen.getAllByTestId('spending-limit-spender')
    expect(cards).toHaveLength(3)
    expect(within(cards[0]).getByText('Spender 1')).toBeInTheDocument()
    expect(within(cards[0]).getByText('USDC')).toBeInTheDocument()
    expect(within(cards[0]).queryByText('UNKNOWN')).not.toBeInTheDocument()
    expect(within(cards[2]).getByText('Spender 3')).toBeInTheDocument()
    expect(within(cards[2]).getByText('UNKNOWN')).toBeInTheDocument()
  })

  it('falls back to the symbol for a token with no logo', () => {
    const [, , unknownSpender] = mockMultiSpenderPolicy().data.spenders
    render(<SpendingLimits spenders={[unknownSpender]} showUsage />)

    expect(screen.getByText('UNKNOWN')).toBeInTheDocument()

    // TokenIcon renders an iframe titled with the token symbol; its srcDoc embeds the <img> src it resolved.
    const iconSrcDoc = screen.getByTitle('UNKNOWN').getAttribute('srcdoc')
    const imgSrc = iconSrcDoc?.match(/<img src="([^"]*)"/)?.[1]
    expect(imgSrc).toBe('/images/common/token-placeholder.svg')
  })

  // The address book returns checksummed keys; matching only on a lowercased key
  // would leave every spender anonymous once this is wired to real data.
  it('resolves a spender name whatever case the names map is keyed in', () => {
    render(<SpendingLimits spenders={spenders} names={{ [MOCK_ADDRESSES.alice]: 'Treasury signer' }} showUsage />)

    expect(screen.getByText('Treasury signer')).toBeInTheDocument()
  })
})
