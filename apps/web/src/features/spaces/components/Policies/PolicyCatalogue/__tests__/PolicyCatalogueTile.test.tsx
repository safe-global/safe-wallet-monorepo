import { WalletCards } from 'lucide-react'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import PolicyCatalogueTile from '../PolicyCatalogueTile'

const defaultProps = {
  id: 'spending-limit' as const,
  title: 'Spending limit',
  description: 'Let spenders access assets without collecting signatures.',
  Icon: WalletCards,
  isAvailable: true,
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

    expect(screen.getByRole('button', { name: /Spending limit/ })).toBeInTheDocument()
    expect(screen.getByText('Let spenders access assets without collecting signatures.')).toBeInTheDocument()
  })

  it('calls onClick when an available tile is clicked', async () => {
    const { user } = renderWithUserEvent(<PolicyCatalogueTile {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Spending limit/ }))

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })

  it('marks an unavailable tile as Soon and disabled', () => {
    render(<PolicyCatalogueTile {...defaultProps} isAvailable={false} />)

    expect(screen.getByText('Soon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Spending limit/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not mark an available tile as Soon', () => {
    render(<PolicyCatalogueTile {...defaultProps} />)

    expect(screen.queryByText('Soon')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Spending limit/ })).not.toHaveAttribute('aria-disabled')
  })

  it('still calls onClick for an unavailable tile so the click can be tracked', async () => {
    const { user } = renderWithUserEvent(<PolicyCatalogueTile {...defaultProps} isAvailable={false} />)

    await user.click(screen.getByRole('button', { name: /Spending limit/ }))

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })
})
