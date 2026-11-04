import { Wallet } from 'lucide-react'
import { render, screen } from '@/tests/test-utils'
import PolicyDrawerHeader from '../PolicyDrawerHeader'

describe('PolicyDrawerHeader', () => {
  it('titles the drawer', () => {
    render(<PolicyDrawerHeader icon={Wallet} title="Spending limit" status="active" />)

    expect(screen.getByText('Spending limit')).toBeInTheDocument()
  })

  it('renders the status it is given', () => {
    render(<PolicyDrawerHeader icon={Wallet} title="Spending limit" status="not-activated" />)

    expect(screen.getByText('Not activated')).toBeInTheDocument()
  })

  it('stands in with a skeleton until the status is known', () => {
    render(<PolicyDrawerHeader icon={Wallet} title="Proposer role" />)

    expect(screen.getByTestId('policy-status-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })
})
