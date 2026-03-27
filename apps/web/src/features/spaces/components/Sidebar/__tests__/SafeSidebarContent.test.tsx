import { render } from '@testing-library/react'
import { ArrowUpRight } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { SafeSidebarContent } from '../variants/SafeSidebarContent'
import type { SidebarGroupConfig, SidebarItemConfig } from '../types'

const mockUseResolvedSidebarNav = jest.fn()
const mockIsRouteEnabled = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { spaceId: '123', safe: 'eth:0x1' },
  }),
}))

const mockUseQueuedTxsLength = jest.fn()

jest.mock('@/hooks/useTxQueue', () => ({
  useQueuedTxsLength: () => mockUseQueuedTxsLength(),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '1' }),
}))

jest.mock('@/utils/chains', () => ({
  isRouteEnabled: (...args: unknown[]) => mockIsRouteEnabled(...args),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { deployed: true } }),
}))

jest.mock('../hooks/useResolvedSidebarNav', () => ({
  useResolvedSidebarNav: jest.fn((main, setup, options) => mockUseResolvedSidebarNav(main, setup, options)),
}))

jest.mock('../config', () => {
  const { AppRoutes } = require('@/config/routes')
  const Icon = () => null
  return {
    safeMainNavigation: [{ icon: Icon, label: 'Transactions', href: AppRoutes.transactions.history }],
    safeDefiGroup: {
      label: 'Defi',
      items: [
        { icon: Icon, label: 'Swap', href: AppRoutes.swap },
        { icon: Icon, label: 'Bridge', href: AppRoutes.bridge },
        { icon: Icon, label: 'Earn', href: AppRoutes.earn },
        { icon: Icon, label: 'Stake', href: AppRoutes.stake },
      ],
    },
  }
})

jest.mock('../variants/SafeSidebarVariant', () => ({
  SafeSidebarVariant: () => <div>Safe sidebar</div>,
}))

const defaultProps = { spaceName: 'Space', spaceInitial: 'S', spaces: [] }

type CallArgs = [
  SidebarItemConfig[],
  SidebarGroupConfig,
  {
    getLink: (item: SidebarItemConfig) => { pathname: string; query: Record<string, string | null | undefined> }
    isItemActive: (item: SidebarItemConfig, pathname: string) => boolean
    isItemDisabled: (item: SidebarItemConfig) => boolean
  },
]

const getCallArgs = () => mockUseResolvedSidebarNav.mock.calls[0] as CallArgs

const renderWithGeoblocking = (isBlockedCountry: boolean | null) =>
  render(
    <GeoblockingContext.Provider value={isBlockedCountry}>
      <SafeSidebarContent {...defaultProps} />
    </GeoblockingContext.Provider>,
  )

describe('SafeSidebarContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsRouteEnabled.mockReturnValue(true)
    mockUseQueuedTxsLength.mockReturnValue(2)
    mockUseResolvedSidebarNav.mockReturnValue({
      mainNavItems: [],
      setupGroup: { label: 'Defi', items: [] },
    })
  })

  it('marks Transactions as active on queue route', () => {
    render(<SafeSidebarContent {...defaultProps} />)

    const [, , options] = getCallArgs()

    const transactionsItem = {
      icon: ArrowUpRight,
      label: 'Transactions',
      href: AppRoutes.transactions.history,
    } as SidebarItemConfig

    expect(options.isItemActive(transactionsItem, AppRoutes.transactions.queue)).toBe(true)
    expect(options.isItemActive(transactionsItem, AppRoutes.transactions.history)).toBe(true)
    expect(options.isItemActive(transactionsItem, AppRoutes.home)).toBe(false)
  })

  describe('geoblocking', () => {
    it('shows all DeFi items when context is null (loading)', () => {
      renderWithGeoblocking(null)

      const [, defiGroup] = getCallArgs()
      expect(defiGroup.items).toHaveLength(4)
    })

    it('shows all DeFi items when user is not blocked', () => {
      renderWithGeoblocking(false)

      const [, defiGroup] = getCallArgs()
      expect(defiGroup.items).toHaveLength(4)
    })

    it('removes all DeFi items when user is blocked', () => {
      renderWithGeoblocking(true)

      const [, defiGroup] = getCallArgs()
      expect(defiGroup.items).toHaveLength(0)
    })

    it('preserves non-DeFi main nav items when user is blocked', () => {
      renderWithGeoblocking(true)

      const [mainNav] = getCallArgs()
      expect(mainNav.some((item) => item.href === AppRoutes.transactions.history)).toBe(true)
    })

    it('isItemDisabled returns true for all geoblocked routes when blocked', () => {
      renderWithGeoblocking(true)

      const [, , options] = getCallArgs()
      expect(options.isItemDisabled({ href: AppRoutes.swap } as SidebarItemConfig)).toBe(true)
      expect(options.isItemDisabled({ href: AppRoutes.bridge } as SidebarItemConfig)).toBe(true)
      expect(options.isItemDisabled({ href: AppRoutes.earn } as SidebarItemConfig)).toBe(true)
      expect(options.isItemDisabled({ href: AppRoutes.stake } as SidebarItemConfig)).toBe(true)
    })

    it('isItemDisabled returns false for non-DeFi routes when blocked', () => {
      renderWithGeoblocking(true)

      const [, , options] = getCallArgs()
      expect(options.isItemDisabled({ href: AppRoutes.transactions.history } as SidebarItemConfig)).toBe(false)
      expect(options.isItemDisabled({ href: AppRoutes.home } as SidebarItemConfig)).toBe(false)
    })

    it('isItemDisabled returns false for geoblocked routes when not blocked', () => {
      renderWithGeoblocking(false)

      const [, , options] = getCallArgs()
      expect(options.isItemDisabled({ href: AppRoutes.swap } as SidebarItemConfig)).toBe(false)
    })

    it('filters DeFi items disabled by the chain even when not geoblocked', () => {
      mockIsRouteEnabled.mockImplementation((href: string) => href !== AppRoutes.earn)
      renderWithGeoblocking(false)

      const [, defiGroup] = getCallArgs()
      expect(defiGroup.items.some((item) => item.href === AppRoutes.earn)).toBe(false)
      expect(defiGroup.items).toHaveLength(3)
    })
  })

  describe('chain filtering', () => {
    it.each([
      ['Swap', AppRoutes.swap],
      ['Bridge', AppRoutes.bridge],
      ['Stake', AppRoutes.stake],
    ])('hides %s when the chain does not support it', (_label, href) => {
      mockIsRouteEnabled.mockImplementation((route: string) => route !== href)
      renderWithGeoblocking(false)

      const [, defiGroup] = getCallArgs()
      expect(defiGroup.items.some((item) => item.href === href)).toBe(false)
      expect(defiGroup.items).toHaveLength(3)
    })
  })

  describe('getLink', () => {
    it('redirects Transactions to queue route when queue is non-empty', () => {
      mockUseQueuedTxsLength.mockReturnValue(3)
      render(<SafeSidebarContent {...defaultProps} />)

      const [, , { getLink }] = getCallArgs()
      const result = getLink({ href: AppRoutes.transactions.history } as SidebarItemConfig)
      expect(result.pathname).toBe(AppRoutes.transactions.queue)
    })

    it('keeps Transactions on history route when queue is empty', () => {
      mockUseQueuedTxsLength.mockReturnValue(0)
      render(<SafeSidebarContent {...defaultProps} />)

      const [, , { getLink }] = getCallArgs()
      const result = getLink({ href: AppRoutes.transactions.history } as SidebarItemConfig)
      expect(result.pathname).toBe(AppRoutes.transactions.history)
    })

    it('passes href through unchanged for non-Transactions items', () => {
      render(<SafeSidebarContent {...defaultProps} />)

      const [, , { getLink }] = getCallArgs()
      expect(getLink({ href: AppRoutes.home } as SidebarItemConfig).pathname).toBe(AppRoutes.home)
      expect(getLink({ href: AppRoutes.balances.index } as SidebarItemConfig).pathname).toBe(AppRoutes.balances.index)
      expect(getLink({ href: AppRoutes.apps.index } as SidebarItemConfig).pathname).toBe(AppRoutes.apps.index)
      expect(getLink({ href: AppRoutes.swap } as SidebarItemConfig).pathname).toBe(AppRoutes.swap)
      expect(getLink({ href: AppRoutes.bridge } as SidebarItemConfig).pathname).toBe(AppRoutes.bridge)
      expect(getLink({ href: AppRoutes.earn } as SidebarItemConfig).pathname).toBe(AppRoutes.earn)
      expect(getLink({ href: AppRoutes.stake } as SidebarItemConfig).pathname).toBe(AppRoutes.stake)
    })
  })
})
