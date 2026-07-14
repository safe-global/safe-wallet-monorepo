import { render, renderWithUserEvent, screen } from '@/tests/test-utils'

const normalizer = (text: string) => text.replace(/\u200A/g, ' ')

describe('FiatValue', () => {
  beforeEach(() => {
    // Only override `language`; replacing the whole navigator object removes
    // `userAgent`, which Base UI (tooltip) reads at import time.
    Object.defineProperty(window.navigator, 'language', {
      value: 'en-US',
      configurable: true,
    })
  })

  it('should render fiat value', async () => {
    const FiatValue = require('.').default
    const { user, getByText } = renderWithUserEvent(<FiatValue value={100} />)
    const span = getByText((content) => normalizer(content) === '$ 100', { normalizer })
    expect(span).toBeInTheDocument()

    // Full-precision value is now shown in a hover tooltip (was an aria-label)
    await user.hover(span)
    const tooltip = await screen.findByText('$ 100.00', { selector: '[data-slot="tooltip-content"]' })
    expect(tooltip).toBeInTheDocument()
  })

  it('should render a big fiat value', async () => {
    const FiatValue = require('.').default
    const { user, getByText } = renderWithUserEvent(<FiatValue value={100_285_367} />)
    const span = getByText((content) => normalizer(content) === '$ 100.29M', { normalizer })
    expect(span).toBeInTheDocument()

    await user.hover(span)
    const tooltip = await screen.findByText('$ 100,285,367.00', { selector: '[data-slot="tooltip-content"]' })
    expect(tooltip).toBeInTheDocument()
  })

  it('should render fiat value with precise=true', () => {
    const FiatValue = require('.').default
    const { getByText } = render(<FiatValue value={100.35} precise />)
    expect(getByText((content) => normalizer(content) === '$ 100', { normalizer })).toBeInTheDocument()
    expect(getByText('.35')).toBeInTheDocument()
  })

  it('should render fiat value with maxLength=3', () => {
    const FiatValue = require('.').default
    const { getByText } = render(<FiatValue value={100.35} maxLength={3} />)
    expect(getByText((content) => normalizer(content) === '$ 100', { normalizer })).toBeInTheDocument()
  })

  it('should render fiat value with maxLength=3 and precise=true', () => {
    const FiatValue = require('.').default
    const { getByText } = render(<FiatValue value={100.35} maxLength={3} precise />)
    expect(getByText((content) => normalizer(content) === '$ 100', { normalizer })).toBeInTheDocument()
  })

  it('should render `--` if passed value is null', () => {
    const FiatValue = require('.').default
    const { getByText } = render(<FiatValue value={null} />)
    expect(getByText('--')).toBeInTheDocument()
  })
})
