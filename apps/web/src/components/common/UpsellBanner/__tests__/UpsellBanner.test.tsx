import { render, screen, fireEvent } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import { UpsellBanner } from '../UpsellBanner'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, onClick, children }: { href: string; onClick?: () => void; children: ReactNode }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

describe('UpsellBanner', () => {
  it('renders the supplied content and a CTA link', () => {
    render(
      <UpsellBanner ctaLabel="Explore plans" ctaHref="/spaces/billing">
        <span>Custom content</span>
      </UpsellBanner>,
    )

    expect(screen.getByText('Custom content')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Explore plans' })
    expect(link).toHaveAttribute('href', '/spaces/billing')
  })

  it('fires onCtaClick when the CTA is clicked', () => {
    const onCtaClick = jest.fn()
    render(
      <UpsellBanner ctaLabel="Go" ctaHref="/x" onCtaClick={onCtaClick}>
        content
      </UpsellBanner>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Go' }))
    expect(onCtaClick).toHaveBeenCalledTimes(1)
  })

  it('applies the requested elevation', () => {
    render(
      <UpsellBanner ctaLabel="Go" ctaHref="/x" elevation="md" data-testid="banner">
        content
      </UpsellBanner>,
    )

    expect(screen.getByTestId('banner').className).toContain('elevationMd')
  })
})
