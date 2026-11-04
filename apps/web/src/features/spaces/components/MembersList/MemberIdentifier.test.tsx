import { act, fireEvent, mockClipboard, render, screen } from '@/tests/test-utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import MemberIdentifier from './MemberIdentifier'

const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const SHORT_WALLET_ADDRESS = shortenAddress(WALLET_ADDRESS)

const addressMember = memberBuilder()
  .with({ name: 'Bob', user: memberUserBuilder().with({ email: null, address: WALLET_ADDRESS }).build() })
  .build()

// Drives the ResizeObserver callback by hand and stubs layout widths, which jsdom reports as 0
const withMeasuredWidths = (widths: { container: number; content: number }) => {
  let notify: (() => void) | undefined
  class ResizeObserverMock {
    constructor(callback: ResizeObserverCallback) {
      notify = () => callback([], this as unknown as ResizeObserver)
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  const globalWithObserver = globalThis as { ResizeObserver?: typeof ResizeObserver }
  const originalObserver = globalWithObserver.ResizeObserver
  globalWithObserver.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => widths.container })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => widths.content })

  return {
    resize: () => act(() => notify?.()),
    restore: () => {
      globalWithObserver.ResizeObserver = originalObserver
      delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
      delete (HTMLElement.prototype as { offsetWidth?: number }).offsetWidth
    },
  }
}

describe('MemberIdentifier', () => {
  it('renders nothing for a member without an email or address', () => {
    const { container } = render(<MemberIdentifier member={memberBuilder().with({ name: 'Bob' }).build()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shortens the address until the cell has been measured', () => {
    render(<MemberIdentifier member={addressMember} />)

    expect(screen.getByText(SHORT_WALLET_ADDRESS)).toBeInTheDocument()
    expect(screen.queryByText(WALLET_ADDRESS)).not.toBeInTheDocument()
  })

  it('shows the full address once the cell is wide enough for it and the copy button', () => {
    const layout = withMeasuredWidths({ container: 1000, content: 100 })
    try {
      render(<MemberIdentifier member={addressMember} />)
      layout.resize()

      expect(screen.getByText(WALLET_ADDRESS)).toBeInTheDocument()
      expect(screen.queryByText(SHORT_WALLET_ADDRESS)).not.toBeInTheDocument()
    } finally {
      layout.restore()
    }
  })

  it('keeps the address shortened when the full value would be clipped', () => {
    const layout = withMeasuredWidths({ container: 150, content: 100 })
    try {
      render(<MemberIdentifier member={addressMember} />)
      layout.resize()

      expect(screen.getByText(SHORT_WALLET_ADDRESS)).toBeInTheDocument()
    } finally {
      layout.restore()
    }
  })

  it('never shortens an email', () => {
    const layout = withMeasuredWidths({ container: 150, content: 100 })
    try {
      render(
        <MemberIdentifier
          member={memberBuilder()
            .with({ name: 'Alice', user: memberUserBuilder().with({ email: 'alice@example.com' }).build() })
            .build()}
        />,
      )
      layout.resize()

      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    } finally {
      layout.restore()
    }
  })

  it('copies the full address regardless of how it is displayed', () => {
    const writeText = mockClipboard()
    render(<MemberIdentifier member={addressMember} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }))

    expect(writeText).toHaveBeenCalledWith(WALLET_ADDRESS)
  })
})
