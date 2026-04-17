import { render, screen } from '@/tests/test-utils'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import SafeItemCard from './SafeItemCard'

jest.mock('@/features/myAccounts', () => ({
  useSafeItemData: () => ({
    name: undefined,
    safeOverview: { fiatTotal: 0 },
    threshold: 1,
    owners: [{ value: '0x0000000000000000000000000000000000000001' }],
    elementRef: { current: null },
    undeployedSafe: undefined,
    isActivating: false,
  }),
}))

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: () => undefined,
}))

jest.mock('@/hooks/useSafeDisplayName', () => ({
  useSafeDisplayName: () => undefined,
}))

jest.mock('./PinnedSafeContextMenu', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

describe('SafeItemCard', () => {
  it('hides read-only badge when high similarity is shown', () => {
    const safeItem = safeItemBuilder()
      .with({
        address: '0x1234567890123456789012345678901234567890',
        isReadOnly: true,
      })
      .build()

    render(<SafeItemCard safeItem={safeItem} isSimilar />)

    expect(screen.getByText('High similarity')).toBeInTheDocument()
    expect(screen.queryByText('Read-only')).not.toBeInTheDocument()
  })

  it('shows read-only badge when safe is read-only and not flagged as similar', () => {
    const safeItem = safeItemBuilder()
      .with({
        isReadOnly: true,
      })
      .build()

    render(<SafeItemCard safeItem={safeItem} />)

    expect(screen.queryByText('High similarity')).not.toBeInTheDocument()
    expect(screen.getByText('Read-only')).toBeInTheDocument()
  })
})
