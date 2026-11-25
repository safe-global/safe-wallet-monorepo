import { Users, Wallet } from 'lucide-react'
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

  it('should, when an allowlist is in a change, show the change beside the status of the change', () => {
    render(
      <PolicyDrawerHeader
        icon={Users}
        title="Allowlist"
        status={{ state: 'removal-in-delay', change: 'removal', label: 'In delay', variant: 'warning' }}
      />,
    )

    expect(screen.getByTestId('policy-change-removal')).toHaveTextContent('Removal')
    expect(screen.getByTestId('policy-status-removal-in-delay')).toHaveTextContent('In delay')
  })

  it('should, when an allowlist is in no change, show its status alone', () => {
    render(
      <PolicyDrawerHeader
        icon={Users}
        title="Allowlist"
        status={{ state: 'active', label: 'Active', variant: 'success' }}
      />,
    )

    expect(screen.getByTestId('allowlist-status-tags')).toHaveTextContent(/^Active$/)
    expect(screen.queryByTestId(/^policy-change-/)).not.toBeInTheDocument()
  })
})
