import { render } from '@/tests/test-utils'

const normalizer = (text: string) => text.replace(/\u200A/g, ' ')

describe('FiatValue', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: {
        language: 'en-US',
      },
      writable: true,
    })
  })

  it('should render fiat value', () => {
    const FiatValue = require('.').default
    const { getByText } = render(<FiatValue value={100} />)
    const span = getByText((content) => normalizer(content) === '$ 100', { normalizer })
    expect(span).toBeInTheDocument()
    expect(span).toHaveAttribute('aria-label', '$ 100.00')
  })

  it('should render a big fiat value', () => {
    const FiatValue = require('.').default
    const { getByText } = render(<FiatValue value={100_285_367} />)
    const span = getByText((content) => normalizer(content) === '$ 100.29M', { normalizer })
    expect(span).toBeInTheDocument()
    expect(span).toHaveAttribute('aria-label', '$ 100,285,367.00')
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
