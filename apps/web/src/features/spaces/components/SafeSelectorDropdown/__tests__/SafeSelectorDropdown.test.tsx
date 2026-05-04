import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import SafeSelectorDropdown from '../index'
import type { SafeItemData } from '../types'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('../components/SafeSelectorTriggerContent', () => ({
  __esModule: true,
  default: () => <span data-testid="safe-selector-trigger-content" />,
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
    }: {
      children?: React.ReactNode
      value?: string
      onValueChange?: (next: string | null, details: { reason: string; cancel: () => void }) => void
    }) => (
      <div data-testid="mock-select-root" data-mock-controlled-value={value}>
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
      jest.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>)

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
    it('renders an error message when items are loaded but selectedItemId has no match', () => {
      const itemA = createItem()
      render(<SafeSelectorDropdown items={[itemA]} selectedItemId="999:0xnotfound" isLoading={false} />)

      expect(screen.getByText('This Safe is not available on the selected network')).toBeInTheDocument()
    })

    it('keeps showing the skeleton while items are still loading and there is no match yet', () => {
      const itemA = createItem()
      render(<SafeSelectorDropdown items={[itemA]} selectedItemId="999:0xnotfound" isLoading={true} />)

      expect(screen.queryByText('This Safe is not available on the selected network')).not.toBeInTheDocument()
    })

    it('shows the load error (not the no-match error) when isError is true', () => {
      const itemA = createItem()
      const onRetry = jest.fn()
      render(
        <SafeSelectorDropdown
          items={[itemA]}
          selectedItemId="999:0xnotfound"
          isLoading={false}
          isError={true}
          onRetry={onRetry}
        />,
      )

      expect(screen.getByText('Failed to load Safe data')).toBeInTheDocument()
      expect(screen.queryByText('This Safe is not available on the selected network')).not.toBeInTheDocument()
    })

    it('shows the skeleton (not the no-match error) when items are empty', () => {
      const { container } = render(<SafeSelectorDropdown items={[]} selectedItemId="1:0xa" isLoading={false} />)

      expect(screen.queryByText('This Safe is not available on the selected network')).not.toBeInTheDocument()
      // Skeleton renders a placeholder block; trigger content is not rendered yet
      expect(screen.queryByTestId('safe-selector-trigger-content')).not.toBeInTheDocument()
      expect(container.firstChild).toBeTruthy()
    })

    it('performs exactly one router.push across pick → rerender → base-ui auto-reset', async () => {
      const mockPush = jest.fn()
      jest.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>)

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
})
