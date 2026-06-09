import { render, screen } from '@/tests/test-utils'
import WorkspaceBanner from '../index'

describe('WorkspaceBanner', () => {
  it('renders the headline and the New tag', () => {
    render(<WorkspaceBanner />)

    expect(screen.getByText('Introducing Workspace')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('links the CTA to the announcement blog post in a safe new tab', () => {
    render(<WorkspaceBanner />)

    const cta = screen.getByRole('link', { name: 'Read the Workspace announcement' })
    expect(cta).toHaveAttribute('href', 'https://safe.global/blog/mpc-wallet-vs-multisig-what-s-the-difference-')
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('forwards a custom className to the card', () => {
    const { container } = render(<WorkspaceBanner className="custom-class" />)

    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})
