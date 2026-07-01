import { render, screen } from '@/tests/test-utils'
import TrustedSafesList from './TrustedSafesList'
import type { SelectableItem } from './useTrustedSafesModal.types'
import { INTRA_LIST_MATCH } from '@/features/address-poisoning'
import type { SelectionSimilarity } from '@/features/address-poisoning'

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

const makeSafe = (address: string, isSelected: boolean, similarity?: SelectionSimilarity): SelectableItem => ({
  chainId: '1',
  address,
  name: address,
  isPinned: isSelected,
  isReadOnly: false,
  lastVisited: 0,
  isSelected,
  similarity,
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

  // Mode B renders a flat list — similarity no longer buckets/floats rows; only selection floats to
  // the top. Flagged (but unselected) rows keep their normal, selection-based position.
  it('does not reorder flagged rows — only selection floats to the top', () => {
    const items = [
      makeSafe(ADDR.selectedB, true),
      makeSafe(ADDR.unselectedA, false, { match: INTRA_LIST_MATCH, intraList: true }),
      makeSafe(ADDR.unselectedC, false, { match: INTRA_LIST_MATCH, intraList: true }),
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

    expect(checkboxOrder()).toEqual([ADDR.selectedB, ADDR.unselectedA, ADDR.unselectedC])
  })
})
