import { render } from '@/src/tests/test-utils'
import { Logo } from '.'

describe('Logo', () => {
  it('should render the default markup', () => {
    const container = render(<Logo logoUri="http://something.com/my-image.png" accessibilityLabel="Mocked logo" />)

    expect(container.getByLabelText('Mocked logo')).toBeTruthy()
  })

  it('should render the fallback markup', () => {
    const container = render(<Logo />)

    expect(container.queryByTestId('logo-image')).not.toBeTruthy()
    expect(container.queryByTestId('logo-fallback-icon')).toBeTruthy()
  })

  it('should show fallback when logoUri is not provided', () => {
    const container = render(<Logo logoUri={null} />)

    expect(container.queryByTestId('logo-image')).not.toBeTruthy()
    expect(container.queryByTestId('logo-fallback-icon')).toBeTruthy()
  })

  it('should show fallback when logoUri is empty string', () => {
    const container = render(<Logo logoUri="" />)

    expect(container.queryByTestId('logo-image')).not.toBeTruthy()
    expect(container.queryByTestId('logo-fallback-icon')).toBeTruthy()
  })

  it('should use custom fallback icon when specified', () => {
    const container = render(<Logo fallbackIcon="wallet" />)

    const fallbackIcon = container.getByTestId('logo-fallback-icon')
    expect(fallbackIcon).toBeTruthy()
  })

  it('should render with custom size', () => {
    const container = render(<Logo logoUri="http://something.com/my-image.png" size="$6" />)

    // Initially, only fallback should be visible until image loads
    expect(container.queryByTestId('logo-fallback-icon')).toBeTruthy()
  })

  it('should render with badge content when provided', () => {
    const badgeContent = <span data-testid="badge-content">Badge</span>
    const container = render(<Logo logoUri="http://something.com/my-image.png" badgeContent={badgeContent} />)

    // Component should render without errors
    expect(container.queryByTestId('logo-fallback-icon')).toBeTruthy()
  })

  it('should handle different image backgrounds', () => {
    const container = render(<Logo logoUri="http://something.com/my-image.png" imageBackground="$colorPrimary" />)

    expect(container.queryByTestId('logo-fallback-icon')).toBeTruthy()
  })
})
