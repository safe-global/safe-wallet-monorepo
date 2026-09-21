import { render, screen } from '@testing-library/react'
import ChainLogo from '../ChainLogo'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId, imageSize }: { chainId: string; imageSize: number }) => (
    <img data-testid="chain-indicator-network-logo-img" alt={`chain-${chainId}`} width={imageSize} />
  )
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

describe('ChainLogo', () => {
  it('rounds the logo image itself so square artwork crops to a circle', () => {
    // The wrapper's 24px clip circle is wider than the 22px image, so wrapper clipping alone
    // would leave square logo artwork with flat edges — the img must carry its own radius.
    const { container } = render(<ChainLogo chainId="1" />)

    expect(container.firstElementChild).toHaveClass('[&_img]:rounded-full')
    expect(screen.getByTestId('chain-indicator-network-logo-img')).toHaveAttribute('width', '22')
  })

  it('passes a custom size through to the indicator', () => {
    render(<ChainLogo chainId="1" size={16} />)

    expect(screen.getByTestId('chain-indicator-network-logo-img')).toHaveAttribute('width', '16')
  })
})
