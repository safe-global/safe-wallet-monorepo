import { render, screen } from '@testing-library/react'
import GuardBlockedHint from '../GuardBlockedHint'

describe('GuardBlockedHint', () => {
  it('renders nothing when there is no hint', () => {
    const { container } = render(<GuardBlockedHint />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the hint text when blocked', () => {
    render(<GuardBlockedHint hint={{ text: 'Verify the recipient to continue', tone: 'critical' }} />)
    expect(screen.getByText('Verify the recipient to continue')).toBeInTheDocument()
  })
})
