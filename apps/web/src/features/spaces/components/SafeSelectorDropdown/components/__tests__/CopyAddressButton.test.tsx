import { render, screen, fireEvent } from '@testing-library/react'
import CopyAddressButton from '../CopyAddressButton'

const trackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
  OVERVIEW_EVENTS: { COPY_ADDRESS: { action: 'copy' } },
  MixpanelEventParams: { SIDEBAR_ELEMENT: 'sidebar_element' },
}))

describe('CopyAddressButton', () => {
  const writeText = jest.fn()

  beforeAll(() => {
    Object.assign(navigator, { clipboard: { writeText } })
  })

  beforeEach(() => {
    writeText.mockClear()
    trackEvent.mockClear()
  })

  it('uses the default copy-address-btn testid', () => {
    render(<CopyAddressButton address="0xabc" />)
    expect(screen.getByTestId('copy-address-btn')).toBeInTheDocument()
  })

  it('uses a custom testid when provided', () => {
    render(<CopyAddressButton address="0xabc" testId="safe-item-copy-address" />)
    expect(screen.getByTestId('safe-item-copy-address')).toBeInTheDocument()
  })

  it('copies the address and tracks the event on click', () => {
    render(<CopyAddressButton address="0xdeadbeef" />)
    fireEvent.click(screen.getByTestId('copy-address-btn'))
    expect(writeText).toHaveBeenCalledWith('0xdeadbeef')
    expect(trackEvent).toHaveBeenCalled()
  })
})
