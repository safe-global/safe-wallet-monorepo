import { render, screen } from '@/tests/test-utils'
import { ExternalLinkIcon, PlainExternalLinkIcons } from './ExternalLinkIcon'

const CustomIcon = ({ className }: { className?: string }) => <svg className={className} data-testid="custom-icon" />

describe('ExternalLinkIcon', () => {
  it('uses the boxed or custom fallback outside transaction flows', () => {
    const { container } = render(
      <>
        <ExternalLinkIcon />
        <ExternalLinkIcon fallback={CustomIcon} />
      </>,
    )

    expect(container.querySelector('.lucide-external-link')).toBeInTheDocument()
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    expect(container.querySelector('.lucide-arrow-up-right')).not.toBeInTheDocument()
  })

  it('uses the plain arrow within its scope without affecting siblings', () => {
    render(
      <>
        <PlainExternalLinkIcons>
          <div data-testid="scoped">
            <ExternalLinkIcon fallback={CustomIcon} />
          </div>
        </PlainExternalLinkIcons>
        <div data-testid="sibling">
          <ExternalLinkIcon />
        </div>
      </>,
    )

    const scoped = screen.getByTestId('scoped')
    expect(scoped.querySelector('.lucide-arrow-up-right')).toHaveAttribute('aria-hidden', 'true')
    expect(scoped.querySelector('.lucide-external-link')).not.toBeInTheDocument()
    expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument()
    expect(screen.getByTestId('sibling').querySelector('.lucide-external-link')).toBeInTheDocument()
  })
})
