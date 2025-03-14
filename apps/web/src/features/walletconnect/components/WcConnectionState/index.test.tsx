import { render, screen } from '@testing-library/react'
import WcConnectionState from '.'

describe('WcConnectionState component tests', () => {
  const SAFE_LOGO_ALT = 'Safe logo'
  const DAPP_NAME = 'Test dApp'
  const DAPP_LOGO_ALT = `${DAPP_NAME} logo`
  const ICON_URL = 'test-icon-url'
  const SUCCESS_MESSAGE = `${DAPP_NAME} successfully connected!`
  const DISCONNECT_MESSAGE = `${DAPP_NAME} disconnected`
  const FALLBACK_SUCCESS_MESSAGE = 'dApp successfully connected!'
  const DAPP_URL = `https://${Math.random().toString(36).substring(7)}.com`

  const mockMetadata = {
    name: DAPP_NAME,
    icons: [ICON_URL],
    description: 'Test description',
    url: DAPP_URL,
  }

  jest.mock('@/components/safe-apps/SafeAppIconCard', () => {
    const MockSafeAppIconCard = (props: { alt: string }) => (
      <div data-testid="mock-safe-app-icon-card">{`${props.alt} TestdApp Logo`}</div>
    )
    MockSafeAppIconCard.displayName = 'MockSafeAppIconCard'
    return MockSafeAppIconCard
  })

  it('Verify successful connection state is rendered correctly', () => {
    render(<WcConnectionState metadata={mockMetadata} isDelete={false} />)

    expect(screen.getByAltText(SAFE_LOGO_ALT)).toBeVisible()
    expect(screen.getByTestId('connection-dots')).toBeVisible()
    expect(screen.getByAltText(DAPP_LOGO_ALT)).toBeVisible()
    expect(screen.getByText(SUCCESS_MESSAGE)).toBeVisible()
  })

  it('Verify disconnection state is rendered correctly', () => {
    render(<WcConnectionState metadata={mockMetadata} isDelete={true} />)

    expect(screen.getByAltText(SAFE_LOGO_ALT)).toBeVisible()
    const dots = screen.getByTestId('connection-dots')
    expect(dots).toBeVisible()
    expect(dots).toHaveClass('errorDots')
    expect(screen.getByAltText(DAPP_LOGO_ALT)).toBeVisible()
    expect(screen.getByText(DISCONNECT_MESSAGE)).toBeVisible()
  })

  it('Verify fallback dApp name is used when metadata is missing', () => {
    render(<WcConnectionState isDelete={false} />)

    expect(screen.getByText(FALLBACK_SUCCESS_MESSAGE)).toBeVisible()
  })

  it('Verify fallback icon is used when dApp icons array is empty', () => {
    render(<WcConnectionState metadata={{ ...mockMetadata, icons: [] }} isDelete={false} />)

    expect(screen.getByAltText(DAPP_LOGO_ALT)).toBeVisible()
  })

  it('Verify WcConnectionState component layout structure', () => {
    render(<WcConnectionState metadata={mockMetadata} isDelete={false} />)

    const container = screen.getByTestId('wc-connection-state')
    expect(container).toHaveClass('container')

    expect(screen.getByAltText(SAFE_LOGO_ALT)).toBeInTheDocument()
    expect(screen.getByTestId('connection-dots')).toBeInTheDocument()
    expect(screen.getByAltText(DAPP_LOGO_ALT)).toBeInTheDocument()
  })

  it('Verify WcConnectionState typography styling', () => {
    render(<WcConnectionState metadata={mockMetadata} isDelete={false} />)

    const message = screen.getByText(SUCCESS_MESSAGE)
    expect(message).toHaveClass('MuiTypography-h5')
    expect(message).toHaveStyle({ marginTop: '24px' })
  })
})
