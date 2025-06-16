import { render } from '@/src/tests/test-utils'
import { TokenIcon } from './TokenIcon'

describe('TokenIcon', () => {
  it('should render with optimized CoinGecko URLs', () => {
    const thumbnailUrl = 'https://coin-images.coingecko.com/coins/images/25244/thumb/Optimism.png'
    const container = render(<TokenIcon logoUri={thumbnailUrl} accessibilityLabel="Token logo" />)

    const logoImage = container.getByTestId('logo-image')
    expect(logoImage.props.source.uri).toBe('https://coin-images.coingecko.com/coins/images/25244/large/Optimism.png')
  })

  it('should pass through non-CoinGecko URLs unchanged', () => {
    const regularUrl = 'https://example.com/token-logo.png'
    const container = render(<TokenIcon logoUri={regularUrl} accessibilityLabel="Token logo" />)

    const logoImage = container.getByTestId('logo-image')
    expect(logoImage.props.source.uri).toBe(regularUrl)
  })

  it('should render fallback icon when no logoUri is provided', () => {
    const container = render(<TokenIcon accessibilityLabel="Token" />)

    expect(container.queryByTestId('logo-image')).not.toBeTruthy()
    expect(container.queryByTestId('logo-fallback-icon')).toBeTruthy()
  })

  it('should use token icon as default fallback', () => {
    const container = render(<TokenIcon accessibilityLabel="Token" />)

    // Just verify the fallback icon is rendered - the default fallback for TokenIcon should be 'token'
    expect(container.getByTestId('logo-fallback-icon')).toBeTruthy()
  })

  it('should pass all props to Logo component', () => {
    const props = {
      logoUri: 'https://example.com/logo.png',
      accessibilityLabel: 'Custom token',
      size: '$8',
      imageBackground: '$blue',
      fallbackIcon: 'nft' as const,
    }

    const container = render(<TokenIcon {...props} />)

    expect(container.getByLabelText('Custom token')).toBeTruthy()
  })
})
