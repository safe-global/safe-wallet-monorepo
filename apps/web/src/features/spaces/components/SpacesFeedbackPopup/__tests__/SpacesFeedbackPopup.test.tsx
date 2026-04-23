import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SpacesFeedbackPopup } from '../SpacesFeedbackPopup'

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: ReactNode }) => <div data-testid="avatar">{children}</div>,
  AvatarImage: ({ src, alt }: { src: string; alt: string }) => <img data-testid="avatar-image" src={src} alt={alt} />,
  AvatarFallback: ({ children }: { children: ReactNode }) => <span data-testid="avatar-fallback">{children}</span>,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span data-testid="badge">{children}</span>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    'aria-label': ariaLabel,
    render: renderProp,
  }: {
    children: ReactNode
    onClick?: () => void
    'aria-label'?: string
    render?: React.ReactElement<{ href?: string; target?: string; rel?: string }>
  }) =>
    renderProp ? (
      <a href={renderProp.props.href} target={renderProp.props.target} rel={renderProp.props.rel}>
        {children}
      </a>
    ) : (
      <button aria-label={ariaLabel} onClick={onClick}>
        {children}
      </button>
    ),
}))

jest.mock('@/components/ui/typography', () => ({
  Typography: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}))

const baseProps = {
  name: 'Iva Lukan',
  role: 'Product Designer',
  badge: 'New workspaces',
  title: 'Your feedback matters.',
  description: 'We’re redesigning our workspaces and want to hear from users like you.',
  ctaLabel: 'Book a call',
  ctaHref: 'https://calendly.com/iva-safe/30min',
}

describe('SpacesFeedbackPopup', () => {
  it('renders all content from props', () => {
    render(<SpacesFeedbackPopup {...baseProps} />)

    expect(screen.getByText('Iva Lukan')).toBeInTheDocument()
    expect(screen.getByText('Product Designer')).toBeInTheDocument()
    expect(screen.getByText('New workspaces')).toBeInTheDocument()
    expect(screen.getByText('Your feedback matters.')).toBeInTheDocument()
    expect(screen.getByText(/We’re redesigning our workspaces/)).toBeInTheDocument()
    expect(screen.getByText('Book a call')).toBeInTheDocument()
  })

  it('renders CTA as an external link that opens in a new tab', () => {
    render(<SpacesFeedbackPopup {...baseProps} />)

    const link = screen.getByRole('link', { name: /Book a call/i })
    expect(link).toHaveAttribute('href', baseProps.ctaHref)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer noopener')
  })

  it('renders the avatar image when avatarSrc is provided', () => {
    render(<SpacesFeedbackPopup {...baseProps} avatarSrc="/avatar.png" />)

    const image = screen.getByTestId('avatar-image')
    expect(image).toHaveAttribute('src', '/avatar.png')
    expect(image).toHaveAttribute('alt', 'Iva Lukan')
  })

  it('renders the avatarFallback text when provided', () => {
    render(<SpacesFeedbackPopup {...baseProps} avatarFallback="IL" />)

    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('IL')
  })

  it('renders an empty fallback when no avatarFallback is provided', () => {
    render(<SpacesFeedbackPopup {...baseProps} />)

    expect(screen.getByTestId('avatar-fallback')).toBeEmptyDOMElement()
  })

  describe('uncontrolled mode', () => {
    it('is visible by default and hides itself after close is clicked', () => {
      render(<SpacesFeedbackPopup {...baseProps} />)

      expect(screen.getByText('Your feedback matters.')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /close/i }))

      expect(screen.queryByText('Your feedback matters.')).not.toBeInTheDocument()
    })

    it('calls onClose when the close button is clicked', () => {
      const handleClose = jest.fn()
      render(<SpacesFeedbackPopup {...baseProps} onClose={handleClose} />)

      fireEvent.click(screen.getByRole('button', { name: /close/i }))

      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('controlled mode', () => {
    it('renders null when open is false', () => {
      const { container } = render(<SpacesFeedbackPopup {...baseProps} open={false} />)

      expect(container).toBeEmptyDOMElement()
    })

    it('renders when open is true', () => {
      render(<SpacesFeedbackPopup {...baseProps} open />)

      expect(screen.getByText('Your feedback matters.')).toBeInTheDocument()
    })

    it('does not hide itself on close when open is controlled — only fires onClose', () => {
      const handleClose = jest.fn()
      render(<SpacesFeedbackPopup {...baseProps} open onClose={handleClose} />)

      fireEvent.click(screen.getByRole('button', { name: /close/i }))

      expect(handleClose).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Your feedback matters.')).toBeInTheDocument()
    })
  })
})
