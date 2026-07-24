import { render, screen } from '@/tests/test-utils'
import PolicyDetailDrawer, { type PolicyDetail } from '../PolicyDetailDrawer'

const SAFE = { chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }

const tokenWithdraw: PolicyDetail = {
  type: 'ERC20TransferPolicy',
  safe: SAFE,
  allowlist: [
    {
      token: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC' },
      recipients: [
        { address: '0xdead00000000000000000000000000000000de01', name: 'Payroll' },
        { address: '0xdead00000000000000000000000000000000de02', name: null },
      ],
    },
  ],
}

describe('PolicyDetailDrawer — token-withdraw variant', () => {
  it('renders the token-withdraw header and enforced-by footer', () => {
    render(<PolicyDetailDrawer policy={tokenWithdraw} onClose={jest.fn()} />)

    expect(screen.getByText('Token withdraw allowlist')).toBeInTheDocument()
    expect(screen.getByText(/Enforced by/i)).toHaveTextContent('Safe Policy Guard')
  })

  it('renders per-token recipient rows (name or shortened address)', () => {
    render(<PolicyDetailDrawer policy={tokenWithdraw} onClose={jest.fn()} />)

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('Payroll')).toBeInTheDocument()
    // The unnamed recipient falls back to a shortened address.
    expect(screen.getByText('0xdead...de02')).toBeInTheDocument()
  })

  it('renders nothing when policy is null', () => {
    const { container } = render(<PolicyDetailDrawer policy={null} onClose={jest.fn()} />)
    expect(screen.queryByText('Token withdraw allowlist')).not.toBeInTheDocument()
    expect(container).toBeInTheDocument()
  })
})
