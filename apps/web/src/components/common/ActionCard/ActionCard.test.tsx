import { render, fireEvent } from '@/tests/test-utils'
import { ActionCard } from '.'
import type { ActionCardButton } from '.'
import { trackEvent } from '@/services/analytics'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

describe('ActionCard', () => {
  describe('Severity variants', () => {
    it('should render info severity with correct styling', () => {
      const { getByTestId } = render(<ActionCard severity="info" title="Info Title" />)
      const card = getByTestId('action-card')
      expect(card).toHaveStyle({ backgroundColor: 'var(--color-info-background)' })
    })

    it('should render warning severity with correct styling', () => {
      const { getByTestId } = render(<ActionCard severity="warning" title="Warning Title" />)
      const card = getByTestId('action-card')
      expect(card).toHaveStyle({ backgroundColor: 'var(--color-warning-background)' })
    })

    it('should render critical severity with correct styling', () => {
      const { getByTestId } = render(<ActionCard severity="critical" title="Critical Title" />)
      const card = getByTestId('action-card')
      expect(card).toHaveStyle({ backgroundColor: 'var(--color-error-background)' })
    })
  })

  describe('Title rendering', () => {
    it('should render title text', () => {
      const { getByText } = render(<ActionCard severity="info" title="Test Title" />)
      expect(getByText('Test Title')).toBeInTheDocument()
    })
  })

  describe('Content rendering', () => {
    it('should render string content', () => {
      const { getByText } = render(<ActionCard severity="info" title="Title" content="Test content" />)
      expect(getByText('Test content')).toBeInTheDocument()
    })

    it('should render ReactNode content', () => {
      const { getByTestId } = render(
        <ActionCard severity="info" title="Title" content={<div data-testid="custom">Custom</div>} />,
      )
      expect(getByTestId('custom')).toBeInTheDocument()
    })

    it('should not render content section when content is undefined', () => {
      const { container } = render(<ActionCard severity="info" title="Title" />)
      // Should only have title, no extra content sections
      const boxes = container.querySelectorAll('[style*="padding-left: 28px"]')
      expect(boxes.length).toBe(0)
    })

    it('should not render content section for empty string', () => {
      const { container } = render(<ActionCard severity="info" title="Title" content="" />)
      const boxes = container.querySelectorAll('[style*="padding-left: 28px"]')
      // Empty string is falsy, so no content box should render
      expect(boxes.length).toBe(0)
    })
  })

  describe('Action', () => {
    it('should render action button', () => {
      const onClick = jest.fn()
      const action: ActionCardButton = { label: 'Click Me', onClick }
      const { getByText } = render(<ActionCard severity="info" title="Title" action={action} />)

      const button = getByText('Click Me')
      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should handle button with href', () => {
      const action: ActionCardButton = { label: 'Link', href: 'https://example.com' }
      const { getByText } = render(<ActionCard severity="info" title="Title" action={action} />)

      const button = getByText('Link')
      expect(button).toHaveAttribute('href', 'https://example.com')
    })

    it('should always render button with arrow endIcon', () => {
      const action: ActionCardButton = { label: 'Test Button', onClick: () => {} }
      const { container } = render(<ActionCard severity="info" title="Title" action={action} />)

      // Verify endIcon is present (KeyboardArrowRightRoundedIcon is always rendered)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
      expect(button?.querySelector('.MuiButton-endIcon')).toBeInTheDocument()
    })

    it('should not render action section when action is undefined', () => {
      const { container } = render(<ActionCard severity="info" title="Title" />)
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(0)
    })
  })

  describe('Custom testId', () => {
    it('should use custom testId when provided', () => {
      const { getByTestId } = render(<ActionCard severity="info" title="Title" testId="custom-test-id" />)
      expect(getByTestId('custom-test-id')).toBeInTheDocument()
    })

    it('should use default testId when not provided', () => {
      const { getByTestId } = render(<ActionCard severity="info" title="Title" />)
      expect(getByTestId('action-card')).toBeInTheDocument()
    })
  })

  describe('Complex scenarios', () => {
    it('should render with all props combined', () => {
      const onClick = jest.fn()
      const action: ActionCardButton = { label: 'Action', onClick }

      const { getByText, getByTestId } = render(
        <ActionCard
          severity="warning"
          title="Complex Title"
          content={<div data-testid="complex-content">Complex content</div>}
          action={action}
          testId="complex-card"
        />,
      )

      expect(getByText('Complex Title')).toBeInTheDocument()
      expect(getByTestId('complex-content')).toBeInTheDocument()
      expect(getByText('Action')).toBeInTheDocument()
      expect(getByTestId('complex-card')).toBeInTheDocument()
    })

    it('should handle button with target and rel attributes', () => {
      const action: ActionCardButton = {
        label: 'External Link',
        href: 'https://example.com',
        target: '_blank',
        rel: 'noopener noreferrer',
      }
      const { getByText } = render(<ActionCard severity="info" title="Title" action={action} />)

      const button = getByText('External Link')
      expect(button).toHaveAttribute('target', '_blank')
      expect(button).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Analytics tracking', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should track event when action button is clicked with trackingEvent prop', () => {
      const onClick = jest.fn()
      const trackingEvent = { action: 'Test action', category: 'test' }
      const action: ActionCardButton = { label: 'Click Me', onClick }

      const { getByText } = render(
        <ActionCard severity="info" title="Title" action={action} trackingEvent={trackingEvent} />,
      )

      const button = getByText('Click Me')
      fireEvent.click(button)

      expect(trackEvent).toHaveBeenCalledWith(trackingEvent)
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should track event for href links when trackingEvent provided', () => {
      const trackingEvent = { action: 'Test link', category: 'test' }
      const action: ActionCardButton = { label: 'Link', href: 'https://example.com' }

      const { getByText } = render(
        <ActionCard severity="info" title="Title" action={action} trackingEvent={trackingEvent} />,
      )

      const link = getByText('Link')
      fireEvent.click(link)

      expect(trackEvent).toHaveBeenCalledWith(trackingEvent)
    })

    it('should not track when trackingEvent is not provided', () => {
      const onClick = jest.fn()
      const action: ActionCardButton = { label: 'Click Me', onClick }

      const { getByText } = render(<ActionCard severity="info" title="Title" action={action} />)

      const button = getByText('Click Me')
      fireEvent.click(button)

      expect(trackEvent).not.toHaveBeenCalled()
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should track event before calling onClick handler', () => {
      const callOrder: string[] = []
      const onClick = jest.fn(() => callOrder.push('onClick'))
      const trackingEvent = { action: 'Test action', category: 'test' }
      const action: ActionCardButton = { label: 'Click Me', onClick }

      ;(trackEvent as jest.Mock).mockImplementation(() => callOrder.push('trackEvent'))

      const { getByText } = render(
        <ActionCard severity="info" title="Title" action={action} trackingEvent={trackingEvent} />,
      )

      const button = getByText('Click Me')
      fireEvent.click(button)

      expect(callOrder).toEqual(['trackEvent', 'onClick'])
    })
  })
})
