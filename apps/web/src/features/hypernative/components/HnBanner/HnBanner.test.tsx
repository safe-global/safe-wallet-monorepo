import { render, screen } from '@/tests/test-utils'
import { HnBanner } from './HnBanner'

describe('HnBanner', () => {
  it('renders title and CTA', () => {
    const mockOnHnSignupClick = jest.fn()
    render(<HnBanner onHnSignupClick={mockOnHnSignupClick} />)

    expect(screen.getByText('Strengthen your Safe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument()
  })
})
