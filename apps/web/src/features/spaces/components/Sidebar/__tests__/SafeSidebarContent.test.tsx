import { render } from '@testing-library/react'
import { ArrowUpRight } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { SafeSidebarContent } from '../variants/SafeSidebarContent'
import type { SidebarGroupConfig, SidebarItemConfig } from '../types'

const mockUseResolvedSidebarNav = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { spaceId: '123', safe: 'eth:0x1' },
  }),
}))

jest.mock('@/hooks/useTxQueue', () => ({
  useQueuedTxsLength: () => 2,
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '1' }),
}))

jest.mock('@/utils/chains', () => ({
  isRouteEnabled: () => true,
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { deployed: true } }),
}))

jest.mock('../hooks/useResolvedSidebarNav', () => ({
  useResolvedSidebarNav: jest.fn((main, setup, options) => mockUseResolvedSidebarNav(main, setup, options)),
}))

jest.mock('../config', () => ({
  safeMainNavigation: [
    {
      icon: ArrowUpRight,
      label: 'Transactions',
      href: '/transactions/history',
    },
  ],
  safeDefiGroup: {
    label: 'Defi',
    items: [],
  },
}))

jest.mock('../variants/SafeSidebarVariant', () => ({
  SafeSidebarVariant: () => <div>Safe sidebar</div>,
}))

describe('SafeSidebarContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseResolvedSidebarNav.mockReturnValue({
      mainNavItems: [],
      setupGroup: { label: 'Defi', items: [] },
    })
  })

  it('marks Transactions as active on queue route', () => {
    render(<SafeSidebarContent spaceName="Space" spaceInitial="S" spaces={[]} />)

    const [, , options] = mockUseResolvedSidebarNav.mock.calls[0] as [
      SidebarItemConfig[],
      SidebarGroupConfig,
      { isItemActive: (item: SidebarItemConfig, pathname: string) => boolean },
    ]

    const transactionsItem = {
      icon: ArrowUpRight,
      label: 'Transactions',
      href: AppRoutes.transactions.history,
    } as SidebarItemConfig

    expect(options.isItemActive(transactionsItem, AppRoutes.transactions.queue)).toBe(true)
    expect(options.isItemActive(transactionsItem, AppRoutes.transactions.history)).toBe(true)
    expect(options.isItemActive(transactionsItem, AppRoutes.home)).toBe(false)
  })
})
