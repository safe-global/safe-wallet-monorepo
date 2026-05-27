import { render, screen } from '@/tests/test-utils'
import SpacePolicies from '../index'

describe('SpacePolicies', () => {
  it('renders the Policies heading', () => {
    render(<SpacePolicies />)

    expect(screen.getByRole('heading', { level: 1, name: 'Policies' })).toBeInTheDocument()
  })

  it('renders the three policy cards', () => {
    render(<SpacePolicies />)

    // "Spending Limit" now appears both in the applied-policy card and the tile — match by tile description.
    expect(screen.getByText('Per-member spending cap.')).toBeInTheDocument()
    expect(screen.getByText('Operator Role')).toBeInTheDocument()
    expect(screen.getByText('Account Recovery')).toBeInTheDocument()
  })

  it('marks Operator Role as coming soon', () => {
    render(<SpacePolicies />)

    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })
})
