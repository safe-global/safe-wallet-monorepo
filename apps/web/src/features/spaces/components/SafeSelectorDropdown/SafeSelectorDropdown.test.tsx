import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import SafeSelectorDropdown from './index'
import type { SafeItemData } from './types'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('./components/SafeSelectorTriggerContent', () => ({
  __esModule: true,
  default: () => <span data-testid="safe-selector-trigger-content" />,
}))

jest.mock('./components/SafeDropdownContainer', () => ({
  __esModule: true,
  default: () => null,
}))

/**
 * Simulates a controlled Select that calls onValueChange with the newly chosen id,
 * then again with the previous id (e.g. before the router updates selectedItemId).
 * See SafeSelectorDropdown + SpaceSafeBar: selection is driven by the URL async.
 */
jest.mock('@/components/ui/select', () => {
  const React = require('react') as typeof import('react')
  const NEW_ID = '2:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  const PREV_ID = '1:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

  return {
    __esModule: true,
    Select: ({
      children,
      value,
      onValueChange,
    }: {
      children?: React.ReactNode
      value?: string
      onValueChange?: (next: string | null) => void
    }) => (
      <div data-testid="mock-select-root" data-mock-controlled-value={value}>
        <button
          type="button"
          data-testid="simulate-double-onvaluechange"
          onClick={() => {
            onValueChange?.(NEW_ID)
            onValueChange?.(PREV_ID)
          }}
        >
          simulate double onValueChange
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
  describe('controlled Select double onValueChange', () => {
    it('calls onItemSelect once when Select fires new id then snap-back to the previous id', async () => {
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

      await user.click(screen.getByTestId('simulate-double-onvaluechange'))

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      expect(onItemSelect).toHaveBeenCalledWith(itemB.id)
    })

    /**
     * One navigation per selection — snap-back to the previous id must not trigger a second push.
     */
    it('performs one router.push when onItemSelect is wired like SpaceSafeBar and Select double-fires', async () => {
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

      render(<SafeSelectorWithSpaceSafeBarNavigation items={[itemA, itemB]} selectedItemId={itemA.id} />)

      await user.click(screen.getByTestId('simulate-double-onvaluechange'))

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.home,
        query: { safe: `oeth:${itemB.address}` },
      })
    })
  })
})
