import { render, screen, fireEvent } from '@testing-library/react'
import CopyAddressButton from '../CopyAddressButton'

describe('CopyAddressButton', () => {
  const writeText = jest.fn()
  const originalClipboard = navigator.clipboard

  beforeAll(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  afterAll(() => {
    // Restore the original clipboard so this stub doesn't leak into other test files.
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true })
  })

  beforeEach(() => {
    writeText.mockClear()
  })

  it('uses the default copy-address-btn testid', () => {
    render(<CopyAddressButton address="0xabc" />)
    expect(screen.getByTestId('copy-address-btn')).toBeInTheDocument()
  })

  it('uses a custom testid when provided', () => {
    render(<CopyAddressButton address="0xabc" testId="safe-item-copy-address" />)
    expect(screen.getByTestId('safe-item-copy-address')).toBeInTheDocument()
  })

  it('copies the address and invokes the onCopy callback on click', () => {
    const onCopy = jest.fn()
    render(<CopyAddressButton address="0xdeadbeef" onCopy={onCopy} />)
    fireEvent.click(screen.getByTestId('copy-address-btn'))
    expect(writeText).toHaveBeenCalledWith('0xdeadbeef')
    expect(onCopy).toHaveBeenCalledTimes(1)
  })

  it('copies once per pointer-driven click (pointerdown + click do not double-fire)', () => {
    const onCopy = jest.fn()
    render(<CopyAddressButton address="0xdeadbeef" onCopy={onCopy} />)
    const btn = screen.getByTestId('copy-address-btn')
    fireEvent.pointerDown(btn)
    fireEvent.click(btn)
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(onCopy).toHaveBeenCalledTimes(1)
  })

  it('copies without error when no onCopy callback is provided', () => {
    render(<CopyAddressButton address="0xdeadbeef" />)
    fireEvent.click(screen.getByTestId('copy-address-btn'))
    expect(writeText).toHaveBeenCalledWith('0xdeadbeef')
  })
})
