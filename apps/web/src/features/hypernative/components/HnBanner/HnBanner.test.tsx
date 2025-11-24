import { render, screen } from '@/tests/test-utils'
import { HnBanner } from './HnBanner'

// Mock HnSignupFlow to avoid rendering the actual modal in tests
jest.mock('../HnSignupFlow', () => ({
  HnSignupFlow: ({ open }: { open: boolean }) => (open ? <div data-testid="hn-signup-flow" /> : null),
}))

describe('HnBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('HnBanner', () => {
    it('renders title and CTA', () => {
      const mockOnHnSignupClick = jest.fn()
      render(<HnBanner onHnSignupClick={mockOnHnSignupClick} />)

      expect(screen.getByText('Strengthen your Safe')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument()
    })

    it('renders dismiss button when onDismiss is provided', () => {
      const mockOnHnSignupClick = jest.fn()
      const mockOnDismiss = jest.fn()
      render(<HnBanner onHnSignupClick={mockOnHnSignupClick} onDismiss={mockOnDismiss} />)

      const dismissButton = screen.getByRole('button', { name: 'close' })
      expect(dismissButton).toBeInTheDocument()
    })

    it('does not render dismiss button when onDismiss is not provided', () => {
      const mockOnHnSignupClick = jest.fn()
      render(<HnBanner onHnSignupClick={mockOnHnSignupClick} />)

      const dismissButton = screen.queryByRole('button', { name: 'close' })
      expect(dismissButton).not.toBeInTheDocument()
    })
  })
})
