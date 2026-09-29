import { Wallet } from 'lucide-react'
import { render, screen } from '@/tests/test-utils'
import PolicyDrawerHeader from '../PolicyDrawerHeader'

describe('PolicyDrawerHeader', () => {
  it('titles the drawer', () => {
    render(<PolicyDrawerHeader icon={Wallet} title="Spending limit" />)

    expect(screen.getByText('Spending limit')).toBeInTheDocument()
  })

  it('renders whatever status the drawer puts in its slot', () => {
    render(
      <PolicyDrawerHeader icon={Wallet} title="Spending limit">
        <span>Not enforced</span>
      </PolicyDrawerHeader>,
    )

    expect(screen.getByText('Not enforced')).toBeInTheDocument()
  })

  it('leaves out the status slot when there is none, rather than an empty box', () => {
    const { container } = render(<PolicyDrawerHeader icon={Wallet} title="Spending limit" />)

    expect(container.querySelector('.ml-auto')).not.toBeInTheDocument()
  })
})
