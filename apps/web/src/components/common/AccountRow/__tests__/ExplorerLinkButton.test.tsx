import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExplorerLinkButton from '../ExplorerLinkButton'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'

jest.mock('@/services/analytics', () => ({
  __esModule: true,
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

jest.mock('@/components/ui/tooltip', () => ({
  __esModule: true,
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    render: renderEl,
  }: {
    children?: React.ReactNode
    render?: React.ReactElement<{ children?: React.ReactNode }>
  }) => (renderEl ? React.cloneElement(renderEl, undefined, children) : <>{children}</>),
  TooltipContent: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

describe('ExplorerLinkButton', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders an external link opening the explorer in a new tab', () => {
    render(<ExplorerLinkButton href="https://etherscan.io/address/0x123" title="View on Etherscan" />)

    const link = screen.getByTestId('safe-item-explorer-link')
    expect(link).toHaveAttribute('href', 'https://etherscan.io/address/0x123')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(link).toHaveAttribute('aria-label', 'View on Etherscan')
  })

  it('tracks the open-explorer event and stops propagation on click', async () => {
    const onParentClick = jest.fn()
    render(
      <div onClick={onParentClick}>
        <ExplorerLinkButton href="https://etherscan.io/address/0x123" />
      </div>,
    )

    await userEvent.click(screen.getByTestId('safe-item-explorer-link'))

    expect(trackEvent).toHaveBeenCalledWith(OVERVIEW_EVENTS.OPEN_EXPLORER, expect.any(Object))
    expect(onParentClick).not.toHaveBeenCalled()
  })
})
