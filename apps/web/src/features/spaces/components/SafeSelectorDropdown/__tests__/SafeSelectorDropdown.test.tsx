import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { useSafeAppUrl } from '@/hooks/safe-apps/useSafeAppUrl'
import useChains from '@/hooks/useChains'
import SafeSelectorDropdown from '../index'
import type { SafeItemData } from '../types'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/hooks/safe-apps/useSafeAppUrl', () => ({
  useSafeAppUrl: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/components/ui/tooltip', () => ({
  __esModule: true,
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    render,
  }: {
    children?: React.ReactNode
    render?: React.ReactElement<{ children?: React.ReactNode }>
  }) => {
    if (render) {
      return React.cloneElement(render, undefined, children)
    }
    return <>{children}</>
  },
  TooltipContent: ({ children }: { children?: React.ReactNode }) => (
    <span data-testid="tooltip-content">{children}</span>
  ),
}))

jest.mock('../components/SafeSelectorTriggerContent', () => ({
  __esModule: true,
  default: ({ selectedItem }: { selectedItem: { chains: Array<{ shortName: string }> } }) => (
    <span data-testid="safe-selector-trigger-content" data-shortname={selectedItem.chains[0]?.shortName ?? ''} />
  ),
}))

jest.mock('../components/SafeDropdownContainer', () => ({
  __esModule: true,
  default: () => null,
}))

/**
 * Simulates a controlled Select that calls onValueChange with the newly chosen id,
 * then again with the previous id (e.g. before the router updates selectedItemId).
 * See SafeSelectorDropdown + SpaceSafeBar: selection is driven by the URL async.
 */
jest.mock('@/components/ui/select', () => {
  const NEW_ID = '2:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  const PREV_ID = '1:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

  // Avoid fallbacks to the previous value when the registered SelectItem set changes.
  const itemPressDetails = () => ({ reason: 'item-press' as const, cancel: () => {} })
  // 'none' is base-ui's reason when it auto-corrects after the registered SelectItem set changes
  const noneDetails = () => ({ reason: 'none' as const, cancel: () => {} })

  return {
    __esModule: true,
    Select: ({
      children,
      value,
      onValueChange,
      disabled,
      open,
    }: {
      children?: React.ReactNode
      value?: string
      onValueChange?: (next: string | null, details: { reason: string; cancel: () => void }) => void
      disabled?: boolean
      open?: boolean
    }) => (
      <div
        data-testid="mock-select-root"
        data-mock-controlled-value={value}
        data-mock-disabled={String(!!disabled)}
        data-mock-open={String(!!open)}
      >
        <button
          type="button"
          data-testid="simulate-user-pick-new"
          onClick={() => {
            onValueChange?.(NEW_ID, itemPressDetails())
          }}
        >
          simulate user pick new
        </button>
        <button
          type="button"
          data-testid="simulate-base-ui-auto-reset"
          onClick={() => {
            onValueChange?.(PREV_ID, noneDetails())
          }}
        >
          simulate base-ui auto-reset to initial value
        </button>
        {children}
      </div>
    ),
    SelectTrigger: ({ children, ...rest }: { children?: React.ReactNode }) => (
      <button type="button" data-testid="select-trigger" {...rest}>
        {children}
      </button>
    ),
    SelectValue: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  }
})

const createItem = (overrides: Partial<SafeItemData> = {}): SafeItemData => ({
  id: '1:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  name: 'Safe A',
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  threshold: 1,
  owners: 2,
  balance: '100',
  chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
  ...overrides,
})

/**
 * Mirrors `handleItemSelect` in SpaceSafeBar: each selection resolves chain shortName then calls
 * `router.push({ pathname: AppRoutes.home, query: { safe: shortName:address } })`.
 * Production implementation: `useSpaceSafeSelectorItems.ts` (`handleItemSelect`, `router.push` after `trackEvent`).
 */
function SafeSelectorWithSpaceSafeBarNavigation({
  items,
  selectedItemId,
}: {
  items: SafeItemData[]
  selectedItemId: string
}) {
  const router = useRouter()
  const onItemSelect = (itemId: string) => {
    const colonIndex = itemId.indexOf(':')
    const chainId = itemId.slice(0, colonIndex)
    const address = itemId.slice(colonIndex + 1)
    const shortName = chainId === '1' ? 'eth' : 'oeth'
    router.push({ pathname: AppRoutes.home, query: { safe: `${shortName}:${address}` } })
  }
  return <SafeSelectorDropdown items={items} selectedItemId={selectedItemId} onItemSelect={onItemSelect} />
}

describe('SafeSelectorDropdown', () => {
  beforeEach(() => {
    jest
      .mocked(useRouter)
      .mockReturnValue({ push: jest.fn(), pathname: '/', query: {} } as unknown as ReturnType<typeof useRouter>)
    jest.mocked(useSafeAppUrl).mockReturnValue(undefined)
    jest.mocked(useChains).mockReturnValue({
      configs: [
        { chainId: '1', shortName: 'eth', chainName: 'Ethereum', chainLogoUri: null },
        { chainId: '137', shortName: 'matic', chainName: 'Polygon', chainLogoUri: null },
      ] as ReturnType<typeof useChains>['configs'],
    })
  })

  describe('onValueChange filtering by reason', () => {
    it('forwards user item-press picks to onItemSelect', async () => {
      const user = userEvent.setup()
      const onItemSelect = jest.fn()
      const itemA = createItem()
      const itemB = createItem({
        id: '2:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        name: 'Safe B',
        address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        chains: [{ chainId: '2', chainName: 'Another', chainLogoUri: null, shortName: 'oeth' }],
      })

      render(<SafeSelectorDropdown items={[itemA, itemB]} selectedItemId={itemA.id} onItemSelect={onItemSelect} />)

      await user.click(screen.getByTestId('simulate-user-pick-new'))

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      expect(onItemSelect).toHaveBeenCalledWith(itemB.id)
    })

    /**
     * base-ui's Select fires onValueChange with reason='none' when its registered SelectItem set
     * changes (e.g. expanding/collapsing a multi-chain row) and the controlled value stops matching
     * any registered item — it then resets to its captured initial value. This must NOT trigger
     * navigation, otherwise the user gets bounced back to whichever safe was selected on first mount.
     */
    it('ignores base-ui auto-reset (reason=none) and does not navigate', async () => {
      const mockPush = jest.fn()
      jest
        .mocked(useRouter)
        .mockReturnValue({ push: mockPush, pathname: '/', query: {} } as unknown as ReturnType<typeof useRouter>)

      const user = userEvent.setup()
      const itemA = createItem()
      const itemB = createItem({
        id: '2:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        name: 'Safe B',
        address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        chains: [{ chainId: '2', chainName: 'Another', chainLogoUri: null, shortName: 'oeth' }],
      })

      render(<SafeSelectorWithSpaceSafeBarNavigation items={[itemA, itemB]} selectedItemId={itemB.id} />)

      await user.click(screen.getByTestId('simulate-base-ui-auto-reset'))

      expect(mockPush).not.toHaveBeenCalled()
    })

    /**
     * The realistic regression sequence: user picks a new safe → router.push fires once →
     * parent re-renders with the new selectedItemId → base-ui's registered SelectItem set
     * shifts (e.g. multi-chain row collapses around the previous selection) → onValueChange
     * fires again with reason='none' resetting to the captured initial value.
     *
     * If either guard regresses (the reason filter, the URL-aware safeAddress in
     * useSpaceChainSelector, or the controlled value plumbing), this test catches the
     * second router.push. The two unit tests above only cover each branch in isolation.
     */
    it('renders a fallback trigger when items are loaded but selectedItemId has no match', () => {
      const itemA = createItem()
      render(
        <SafeSelectorDropdown
          items={[itemA]}
          selectedItemId="999:0xnotfound"
          isLoading={false}
          onItemSelect={jest.fn()}
        />,
      )

      expect(screen.getByTestId('mock-select-root')).toBeInTheDocument()
      expect(screen.getByTestId('safe-selector-trigger-content')).toBeInTheDocument()
      // Old "not available" error is gone — main content surfaces the load failure instead.
      expect(screen.queryByText('This Safe is not available on the selected network')).not.toBeInTheDocument()
    })

    it('keeps the fallback trigger openable even when items has a single entry', () => {
      const itemA = createItem()
      render(
        <SafeSelectorDropdown
          items={[itemA]}
          selectedItemId="999:0xnotfound"
          isLoading={false}
          onItemSelect={jest.fn()}
        />,
      )

      const selectRoot = screen.getByTestId('mock-select-root')
      expect(selectRoot.getAttribute('data-mock-disabled')).toBe('false')
    })

    it('looks up the chain shortName from chain configs for the fallback trigger', () => {
      const itemA = createItem()
      render(
        <SafeSelectorDropdown
          items={[itemA]}
          selectedItemId="137:0xe7255eE8D8A47ee01864241e7475C5c7A9792401"
          onItemSelect={jest.fn()}
        />,
      )

      // Fallback chain entry must pick up shortName (`matic`) from chain configs,
      // so the trigger renders `matic:0x...` instead of bare `0x...`.
      expect(screen.getByTestId('safe-selector-trigger-content').getAttribute('data-shortname')).toBe('matic')
    })

    it('forwards the user pick even from the fallback trigger', async () => {
      const user = userEvent.setup()
      const onItemSelect = jest.fn()
      const itemA = createItem()
      const itemB = createItem({
        id: '2:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        name: 'Safe B',
        address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        chains: [{ chainId: '2', chainName: 'Another', chainLogoUri: null, shortName: 'oeth' }],
      })

      render(
        <SafeSelectorDropdown items={[itemA, itemB]} selectedItemId="999:0xnotfound" onItemSelect={onItemSelect} />,
      )

      await user.click(screen.getByTestId('simulate-user-pick-new'))

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      expect(onItemSelect).toHaveBeenCalledWith(itemB.id)
    })

    it('shows the skeleton while items are still loading and selectedItemId is empty', () => {
      const itemA = createItem()
      render(<SafeSelectorDropdown items={[itemA]} selectedItemId="" isLoading={true} />)

      // Empty selectedItemId can't build a fallback item → skeleton
      expect(screen.queryByTestId('safe-selector-trigger-content')).not.toBeInTheDocument()
    })

    it('shows the load error when items are empty and isError is true', () => {
      const onRetry = jest.fn()
      render(
        <SafeSelectorDropdown items={[]} selectedItemId="1:0xa" isLoading={false} isError={true} onRetry={onRetry} />,
      )

      expect(screen.getByText('Failed to load Safe data')).toBeInTheDocument()
    })

    it('shows the skeleton when items are empty and not yet loaded', () => {
      const { container } = render(<SafeSelectorDropdown items={[]} selectedItemId="" isLoading={false} />)

      expect(screen.queryByTestId('safe-selector-trigger-content')).not.toBeInTheDocument()
      expect(container.firstChild).toBeTruthy()
    })

    it('performs exactly one router.push across pick → rerender → base-ui auto-reset', async () => {
      const mockPush = jest.fn()
      jest
        .mocked(useRouter)
        .mockReturnValue({ push: mockPush, pathname: '/', query: {} } as unknown as ReturnType<typeof useRouter>)

      const user = userEvent.setup()
      const itemA = createItem()
      const itemB = createItem({
        id: '2:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        name: 'Safe B',
        address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        chains: [{ chainId: '2', chainName: 'Another', chainLogoUri: null, shortName: 'oeth' }],
      })

      const { rerender } = render(
        <SafeSelectorWithSpaceSafeBarNavigation items={[itemA, itemB]} selectedItemId={itemA.id} />,
      )

      await user.click(screen.getByTestId('simulate-user-pick-new'))

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.home,
        query: { safe: `oeth:${itemB.address}` },
      })

      // Parent re-renders after the URL/Redux update propagates: selectedItemId moves to itemB.
      rerender(<SafeSelectorWithSpaceSafeBarNavigation items={[itemA, itemB]} selectedItemId={itemB.id} />)

      // base-ui then fires an auto-reset (reason='none') as its registered items shift around the
      // now-current value. This must NOT produce a second push.
      await user.click(screen.getByTestId('simulate-base-ui-auto-reset'))

      expect(mockPush).toHaveBeenCalledTimes(1)
    })
  })

  describe('disabled while a tx flow is active', () => {
    const renderWithTxFlow = (txFlow: TxModalContextType['txFlow']) => {
      const itemA = createItem()
      const value: TxModalContextType = {
        txFlow,
        setTxFlow: jest.fn(),
        setFullWidth: jest.fn(),
      }
      return render(
        <TxModalContext.Provider value={value}>
          <SafeSelectorDropdown items={[itemA]} selectedItemId={itemA.id} onItemSelect={jest.fn()} />
        </TxModalContext.Provider>,
      )
    }

    it('keeps the Select mounted, not disabled, and forced closed when a tx flow is open', () => {
      renderWithTxFlow(<div data-testid="active-tx-flow" />)

      const selectRoot = screen.getByTestId('mock-select-root')
      // Not disabled — a disabled <button> would block the nested copy button — but forced closed.
      expect(selectRoot.getAttribute('data-mock-disabled')).toBe('false')
      expect(selectRoot.getAttribute('data-mock-open')).toBe('false')
      expect(screen.getByTestId('safe-selector-trigger-content')).toBeInTheDocument()
    })

    it('renders the explanatory tooltip when a tx flow is open', () => {
      renderWithTxFlow(<div data-testid="active-tx-flow" />)

      expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Changing the Safe is not allowed in this screen')
    })

    it('keeps the disabled styling but leaves the inline address actions interactive when a tx flow is open', () => {
      renderWithTxFlow(<div data-testid="active-tx-flow" />)

      const content = screen.getByTestId('open-safes-icon')
      expect(content.className).toMatch(/cursor-not-allowed/)
      expect(content.className).toMatch(/opacity-50/)
      // The trigger isn't turned into a dead button, so copy + explorer + env hint stay clickable.
      expect(content.className).not.toMatch(/\[&_\*\]:pointer-events-none/)
    })

    it('does not disable the Select or render the tooltip when no tx flow is active', () => {
      renderWithTxFlow(undefined)

      const selectRoot = screen.getByTestId('mock-select-root')
      expect(selectRoot.getAttribute('data-mock-disabled')).toBe('false')
      expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument()

      const trigger = screen.getByTestId('open-safes-icon')
      expect(trigger.className).not.toMatch(/cursor-not-allowed/)
      expect(trigger.className).not.toMatch(/opacity-50/)
    })
  })

  describe('disabled while inside an opened Safe App', () => {
    const renderAtRoute = (pathname: string, query: Record<string, string> = {}) => {
      jest
        .mocked(useRouter)
        .mockReturnValue({ push: jest.fn(), pathname, query } as unknown as ReturnType<typeof useRouter>)
      const itemA = createItem()
      return render(<SafeSelectorDropdown items={[itemA]} selectedItemId={itemA.id} onItemSelect={jest.fn()} />)
    }

    it('keeps the Select forced closed and shows the tooltip on /apps/open when an appUrl is present', () => {
      jest.mocked(useSafeAppUrl).mockReturnValue('https://example-safe-app.test')
      renderAtRoute(AppRoutes.apps.open, { appUrl: 'https://example-safe-app.test' })

      const selectRoot = screen.getByTestId('mock-select-root')
      expect(selectRoot.getAttribute('data-mock-disabled')).toBe('false')
      expect(selectRoot.getAttribute('data-mock-open')).toBe('false')
      expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Changing the Safe is not allowed in this screen')
    })

    it('does not disable the Select on /apps/open without an appUrl', () => {
      renderAtRoute(AppRoutes.apps.open, {})

      const selectRoot = screen.getByTestId('mock-select-root')
      expect(selectRoot.getAttribute('data-mock-disabled')).toBe('false')
      expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument()
    })

    it('does not disable the Select on /apps even with a safe query', () => {
      renderAtRoute(AppRoutes.apps.index, { safe: 'eth:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })

      const selectRoot = screen.getByTestId('mock-select-root')
      expect(selectRoot.getAttribute('data-mock-disabled')).toBe('false')
      expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument()
    })

    it('does not disable the Select on /apps/custom', () => {
      renderAtRoute(AppRoutes.apps.custom, { safe: 'eth:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })

      const selectRoot = screen.getByTestId('mock-select-root')
      expect(selectRoot.getAttribute('data-mock-disabled')).toBe('false')
      expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument()
    })
  })
})
