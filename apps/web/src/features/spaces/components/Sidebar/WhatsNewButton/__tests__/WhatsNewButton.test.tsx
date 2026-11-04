import { render, screen, fireEvent } from '@testing-library/react'
import React, { type ReactNode } from 'react'
import { WhatsNewButton } from '../WhatsNewButton'

const mockTrackEvent = jest.fn()

let mockHasBeamerConsent = true

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  OVERVIEW_EVENTS: {
    WHATS_NEW: { action: "Open What's New" },
  },
  MixpanelEventParams: { SIDEBAR_ELEMENT: 'sidebarElement' },
}))

jest.mock('@/store', () => ({
  useAppSelector: () => mockHasBeamerConsent,
}))

jest.mock('@/config/constants', () => ({
  BEAMER_ID: 'beamer-product-id',
}))

jest.mock('@safe-global/views/components/ui/sidebar', () => ({
  SidebarMenuButton: ({
    children,
    className,
    type = 'button',
    'data-testid': testId,
    'aria-label': ariaLabel,
    onClick,
  }: {
    children?: ReactNode
    className?: string
    type?: 'button' | 'submit' | 'reset'
    'data-testid'?: string
    'aria-label'?: string
    onClick?: React.MouseEventHandler<HTMLButtonElement>
  }) => (
    <button type={type} data-testid={testId} className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
}))

jest.mock('@safe-global/views/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    render,
  }: {
    children: ReactNode
    render: React.ReactElement<{ children?: ReactNode }>
  }) => React.cloneElement(render, {}, children),
  TooltipContent: ({ children }: { children: ReactNode }) => <div role="tooltip">{children}</div>,
}))

let mockUnreadCount = 0
const mockMarkAsSeen = jest.fn()
jest.mock('@/hooks/useWhatsNewUpdates', () => ({
  useWhatsNewUpdates: () => ({ unreadCount: mockUnreadCount, markAsSeen: mockMarkAsSeen }),
}))

jest.mock('../../WhatsNewCornerCard', () => ({
  WhatsNewCornerCard: ({ onOpen }: { onOpen: () => void }) => (
    <button data-testid="whats-new-corner-card" onClick={onOpen} />
  ),
}))

jest.mock('../../WhatsNewDrawer', () => ({
  WhatsNewDrawer: ({ productId, open }: { productId: string; open: boolean }) =>
    open ? <div data-testid="whats-new-drawer" data-product-id={productId} /> : null,
}))

describe('WhatsNewButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasBeamerConsent = true
    mockUnreadCount = 0
  })

  it("fires WHATS_NEW tracking event when clicking What's new", () => {
    render(<WhatsNewButton />)
    fireEvent.click(screen.getByTestId('list-item-whats-new'))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "Open What's New" }),
      expect.objectContaining({ sidebarElement: "What's New" }),
    )
  })

  it("should, when the user has not accepted the Beamer cookies, show no What's new button, panel or corner card", () => {
    mockHasBeamerConsent = false

    render(<WhatsNewButton />)

    expect(screen.queryByTestId('list-item-whats-new')).not.toBeInTheDocument()
    expect(screen.queryByTestId('whats-new-drawer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('whats-new-corner-card')).not.toBeInTheDocument()
  })

  it("opens the What's new drawer with the Beamer product when clicked with Beamer consent", () => {
    render(<WhatsNewButton />)

    expect(screen.queryByTestId('whats-new-drawer')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('list-item-whats-new'))

    expect(screen.getByTestId('whats-new-drawer')).toHaveAttribute('data-product-id', 'beamer-product-id')
  })

  it("should, when Beamer reports unread posts, show their number on the What's new button", () => {
    mockUnreadCount = 6
    render(<WhatsNewButton />)

    expect(screen.getByTestId('list-item-whats-new')).toContainElement(screen.getByTestId('whats-new-unread-count'))
    expect(screen.getByTestId('whats-new-unread-count')).toHaveTextContent('6')
  })

  it("should, when there are no unread posts, show no number on the What's new button", () => {
    render(<WhatsNewButton />)

    expect(screen.queryByTestId('whats-new-unread-count')).not.toBeInTheDocument()
  })

  it("should, when the user opens What's new, mark the posts as seen", () => {
    render(<WhatsNewButton />)
    fireEvent.click(screen.getByTestId('list-item-whats-new'))

    expect(mockMarkAsSeen).toHaveBeenCalledTimes(1)
  })

  it("should, when the user clicks the corner card, open What's new and mark the posts as seen", () => {
    render(<WhatsNewButton />)
    fireEvent.click(screen.getByTestId('whats-new-corner-card'))

    expect(screen.getByTestId('whats-new-drawer')).toBeInTheDocument()
    expect(mockMarkAsSeen).toHaveBeenCalledTimes(1)
  })
})
