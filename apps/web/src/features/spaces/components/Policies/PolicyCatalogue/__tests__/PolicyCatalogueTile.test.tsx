import { WalletCards } from 'lucide-react'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import PolicyCatalogueTile from '../PolicyCatalogueTile'

const defaultProps = {
  id: 'spending-limit' as const,
  title: 'Spending limit',
  description: 'Let spenders access assets without collecting signatures.',
  Icon: WalletCards,
  action: 'Set policy',
  onClick: jest.fn(),
}

describe('PolicyCatalogueTile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('gives each tile a test id of its own so a single tile can be targeted', () => {
    render(<PolicyCatalogueTile {...defaultProps} />)

    expect(screen.getByTestId('policy-catalogue-tile-spending-limit')).toBeInTheDocument()
  })

  it('states the policy name and what it does', () => {
    render(<PolicyCatalogueTile {...defaultProps} />)

    expect(screen.getByText('Spending limit')).toBeInTheDocument()
    expect(screen.getByText('Let spenders access assets without collecting signatures.')).toBeInTheDocument()
  })

  it('should, when rendered, name the button after its action and the policy', () => {
    render(<PolicyCatalogueTile {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Set policy: Spending limit' })).toHaveTextContent('Set policy')
  })

  it('should, when the button is clicked, call onClick once', async () => {
    const { user } = renderWithUserEvent(<PolicyCatalogueTile {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Set policy: Spending limit' }))

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })
})
