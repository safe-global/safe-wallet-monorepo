import { render } from '@testing-library/react'
import { ArrowUpRight } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { SafeSidebarContent } from '../SafeSidebarContent'
import type { SidebarGroupConfig, SidebarItemConfig } from '../../../types'

const mockUseResolvedSidebarNav = jest.fn()
const mockIsRouteEnabled = jest.fn()

const mockRouterPathname = { current: AppRoutes.home }

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { spaceId: '123', safe: 'eth:0x1' },
    pathname: mockRouterPathname.current,
    replace: jest.fn(),
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

const mockUseSafeInfo = jest.fn()

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => mockUseSafeInfo(),
}))

jest.mock('../../../hooks/useResolvedSidebarNav', () => ({
  useResolvedSidebarNav: jest.fn((main, setup, options) => mockUseResolvedSidebarNav(main, setup, options)),
}))

jest.mock('../../../config', () => {
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

const mockSafeSidebarVariant = jest.fn()

jest.mock('../../SafeSidebarVariant', () => ({
  SafeSidebarVariant: (props: unknown) => {
    mockSafeSidebarVariant(props)
    return <div>Safe sidebar</div>
  },
}))

const defaultProps = { spaceInitial: 'S', spaces: [] }

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
    mockUseSafeInfo.mockReturnValue({ safe: { deployed: true } })
    mockRouterPathname.current = AppRoutes.home
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
    expect(options.isItemActive(transactionsItem, AppRoutes.transactions.messages)).toBe(true)
    expect(options.isItemActive(transactionsItem, AppRoutes.transactions.msg)).toBe(true)
    expect(options.isItemActive(transactionsItem, AppRoutes.transactions.tx)).toBe(true)
    expect(options.isItemActive(transactionsItem, AppRoutes.home)).toBe(false)
  })

  it('marks Assets as active on balances sub-routes', () => {
    render(<SafeSidebarContent {...defaultProps} />)

    const [, , options] = getCallArgs()

    const assetsItem = {
      icon: ArrowUpRight,
      label: 'Assets',
      href: AppRoutes.balances.index,
    } as SidebarItemConfig

    expect(options.isItemActive(assetsItem, AppRoutes.balances.index)).toBe(true)
    expect(options.isItemActive(assetsItem, AppRoutes.balances.nfts)).toBe(true)
    expect(options.isItemActive(assetsItem, AppRoutes.balances.positions)).toBe(true)
    expect(options.isItemActive(assetsItem, AppRoutes.home)).toBe(false)
  })

  it('marks Apps as active on app sub-routes', () => {
    render(<SafeSidebarContent {...defaultProps} />)

    const [, , options] = getCallArgs()

    const appsItem = {
      icon: ArrowUpRight,
      label: 'Apps',
      href: AppRoutes.apps.index,
    } as SidebarItemConfig

    expect(options.isItemActive(appsItem, AppRoutes.apps.index)).toBe(true)
    expect(options.isItemActive(appsItem, AppRoutes.apps.custom)).toBe(true)
    expect(options.isItemActive(appsItem, AppRoutes.apps.bookmarked)).toBe(true)
    expect(options.isItemActive(appsItem, AppRoutes.apps.open)).toBe(true)
    expect(options.isItemActive(appsItem, AppRoutes.home)).toBe(false)
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

  describe('undeployed Safe', () => {
    beforeEach(() => {
      mockUseSafeInfo.mockReturnValue({ safe: { deployed: false } })
    })

    it('isItemDisabled returns true for all DeFi routes', () => {
      render(<SafeSidebarContent {...defaultProps} />)

      const [, , options] = getCallArgs()
      expect(options.isItemDisabled({ href: AppRoutes.swap } as SidebarItemConfig)).toBe(true)
      expect(options.isItemDisabled({ href: AppRoutes.bridge } as SidebarItemConfig)).toBe(true)
      expect(options.isItemDisabled({ href: AppRoutes.earn } as SidebarItemConfig)).toBe(true)
      expect(options.isItemDisabled({ href: AppRoutes.stake } as SidebarItemConfig)).toBe(true)
    })

    it('isItemDisabled returns false for non-DeFi routes', () => {
      render(<SafeSidebarContent {...defaultProps} />)

      const [, , options] = getCallArgs()
      expect(options.isItemDisabled({ href: AppRoutes.transactions.history } as SidebarItemConfig)).toBe(false)
      expect(options.isItemDisabled({ href: AppRoutes.home } as SidebarItemConfig)).toBe(false)
    })
  })

  describe('onSpaceAdded propagation', () => {
    it('passes onSpaceAdded into the addToWorkspace workspaceHeader when no space is selected', () => {
      const onSpaceAdded = jest.fn()
      render(
        <GeoblockingContext.Provider value={false}>
          <SafeSidebarContent spaces={[{ id: 1, name: 'My Space', safeCount: 0 }]} onSpaceAdded={onSpaceAdded} />
        </GeoblockingContext.Provider>,
      )

      expect(mockSafeSidebarVariant).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceHeader: expect.objectContaining({
            variant: 'addToWorkspace',
            onSpaceAdded,
          }),
        }),
      )
    })
  })

  describe('getLink', () => {
    it('routes Transactions entry to Queue when the queue is non-empty', () => {
      mockUseQueuedTxsLength.mockReturnValue('3')
      render(<SafeSidebarContent {...defaultProps} />)

      const [, , { getLink }] = getCallArgs()
      expect(getLink({ href: AppRoutes.transactions.history } as SidebarItemConfig).pathname).toBe(
        AppRoutes.transactions.queue,
      )
      expect(getLink({ href: AppRoutes.home } as SidebarItemConfig).pathname).toBe(AppRoutes.home)
      expect(getLink({ href: AppRoutes.balances.index } as SidebarItemConfig).pathname).toBe(AppRoutes.balances.index)
      expect(getLink({ href: AppRoutes.apps.index } as SidebarItemConfig).pathname).toBe(AppRoutes.apps.index)
      expect(getLink({ href: AppRoutes.swap } as SidebarItemConfig).pathname).toBe(AppRoutes.swap)
      expect(getLink({ href: AppRoutes.bridge } as SidebarItemConfig).pathname).toBe(AppRoutes.bridge)
      expect(getLink({ href: AppRoutes.earn } as SidebarItemConfig).pathname).toBe(AppRoutes.earn)
      expect(getLink({ href: AppRoutes.stake } as SidebarItemConfig).pathname).toBe(AppRoutes.stake)
    })

    it('routes Transactions entry to History when the queue is empty', () => {
      mockUseQueuedTxsLength.mockReturnValue('')
      render(<SafeSidebarContent {...defaultProps} />)

      const [, , { getLink }] = getCallArgs()
      expect(getLink({ href: AppRoutes.transactions.history } as SidebarItemConfig).pathname).toBe(
        AppRoutes.transactions.history,
      )
    })
  })

  describe('transactions badge', () => {
    const findTxItem = (mainNav: SidebarItemConfig[]) =>
      mainNav.find((item) => item.href === AppRoutes.transactions.history)

    it('uses a numeric badge when the queue size is parseable', () => {
      mockUseQueuedTxsLength.mockReturnValue('5')
      render(<SafeSidebarContent {...defaultProps} />)

      const [mainNav] = getCallArgs()
      expect(findTxItem(mainNav)?.badge).toBe(5)
    })

    it('preserves the masked "20+" string when the queue exceeds the cap', () => {
      mockUseQueuedTxsLength.mockReturnValue('20+')
      render(<SafeSidebarContent {...defaultProps} />)

      const [mainNav] = getCallArgs()
      expect(findTxItem(mainNav)?.badge).toBe('20+')
    })

    it('passes through an empty queue size without rendering a badge', () => {
      mockUseQueuedTxsLength.mockReturnValue('')
      render(<SafeSidebarContent {...defaultProps} />)

      const [mainNav] = getCallArgs()
      expect(findTxItem(mainNav)?.badge).toBe('')
    })
  })
})
