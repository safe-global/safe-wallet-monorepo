import { render, screen } from '@/tests/test-utils'
import TrustedSafesList from './TrustedSafesList'
import type { SelectableItem } from './useTrustedSafesModal.types'

jest.mock('next/router', () => ({
  useRouter: () => ({ query: {}, pathname: '/home', push: jest.fn() }),
}))

jest.mock('@/features/myAccounts/hooks/useSafeItemData', () => ({
  useSafeItemData: () => ({
    chain: { chainId: '1', shortName: 'eth' },
    name: undefined,
    href: '/home',
    safeOverview: { fiatTotal: '100', address: { value: '0x123' }, queued: 0, awaitingConfirmation: 0 },
    isCurrentSafe: false,
    isActivating: false,
    isReplayable: false,
    isWelcomePage: false,
    threshold: 1,
    owners: [{ value: '0x123' }],
    undeployedSafe: undefined,
    counterfactualSetup: undefined,
    elementRef: { current: null },
    isVisible: true,
    trackingLabel: 'sidebar',
  }),
}))

const makeSafe = (address: string, isSelected: boolean, similarityGroup?: string): SelectableItem => ({
  chainId: '1',
  address,
  name: address,
  isPinned: isSelected,
  isReadOnly: false,
  lastVisited: 0,
  isSelected,
  similarityGroup,
})

const ADDR = {
  unselectedA: '0xaaaa000000000000000000000000000000000001',
  selectedB: '0xbbbb000000000000000000000000000000000002',
  unselectedC: '0xcccc000000000000000000000000000000000003',
  selectedD: '0xdddd000000000000000000000000000000000004',
}

const checkboxOrder = () =>
  screen
    .getAllByTestId(/^safe-item-checkbox-/)
    .map((el) => el.getAttribute('data-testid')?.replace('safe-item-checkbox-', ''))

describe('TrustedSafesList ordering', () => {
  it('floats selected safes to the top while preserving relative order', () => {
    const items = [
      makeSafe(ADDR.unselectedA, false),
      makeSafe(ADDR.selectedB, true),
      makeSafe(ADDR.unselectedC, false),
      makeSafe(ADDR.selectedD, true),
    ]

    render(
      <TrustedSafesList
        items={items}
        isLoading={false}
        searchQuery=""
        onSearchChange={jest.fn()}
        onToggle={jest.fn()}
      />,
    )

    expect(checkboxOrder()).toEqual([ADDR.selectedB, ADDR.selectedD, ADDR.unselectedA, ADDR.unselectedC])
  })

  it('keeps similarity groups at the top regardless of selection', () => {
    const items = [
      makeSafe(ADDR.selectedB, true),
      makeSafe(ADDR.unselectedA, false, 'group-1'),
      makeSafe(ADDR.unselectedC, false, 'group-1'),
    ]

    render(
      <TrustedSafesList
        items={items}
        isLoading={false}
        searchQuery=""
        onSearchChange={jest.fn()}
        onToggle={jest.fn()}
      />,
    )

    expect(checkboxOrder()).toEqual([ADDR.unselectedA, ADDR.unselectedC, ADDR.selectedB])
  })
})
