import { render, screen } from '@/tests/test-utils'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { useSafeItemData } from '@/features/myAccounts'
import { PinnedSafeSubItem } from './PinnedSafeItem'

jest.mock('@/features/myAccounts', () => ({
  useSafeItemData: jest.fn(),
}))

jest.mock('@/hooks/useChains', () => ({
  useChain: () => ({ chainId: '1', shortName: 'eth', chainName: 'Ethereum', chainLogoUri: '' }),
}))

jest.mock('./shared', () => ({
  ChainLogo: () => null,
  ReadOnlyBadge: () => <div data-testid="read-only-badge" />,
  NotActivatedBadge: ({ isActivating }: { isActivating: boolean }) => (
    <div data-testid="pending-activation-icon" aria-label={isActivating ? 'Activating' : 'Inactive'} />
  ),
}))

const mockSafeItemData = (overrides: Partial<ReturnType<typeof useSafeItemData>>) => {
  jest.mocked(useSafeItemData).mockReturnValue({
    href: '/safe',
    safeOverview: undefined,
    undeployedSafe: undefined,
    isActivating: false,
    elementRef: undefined,
    ...overrides,
  } as unknown as ReturnType<typeof useSafeItemData>)
}

describe('PinnedSafeSubItem undeployed badge', () => {
  const safeItem = safeItemBuilder().with({ chainId: '1' }).build()

  it('shows the Inactive badge in place of the balance for an undeployed chain', () => {
    mockSafeItemData({ undeployedSafe: { status: { status: 'AWAITING_EXECUTION' } } as never, isActivating: false })

    render(<PinnedSafeSubItem safeItem={safeItem} />)

    const badge = screen.getByTestId('pending-activation-icon')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('aria-label', 'Inactive')
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })

  it('shows the Activating badge for an activating chain', () => {
    mockSafeItemData({ undeployedSafe: { status: { status: 'PROCESSING' } } as never, isActivating: true })

    render(<PinnedSafeSubItem safeItem={safeItem} />)

    expect(screen.getByTestId('pending-activation-icon')).toHaveAttribute('aria-label', 'Activating')
  })

  it('shows the balance and no badge for a deployed chain', () => {
    mockSafeItemData({
      safeOverview: { fiatTotal: '42', queued: 0 } as never,
      undeployedSafe: undefined,
    })

    render(<PinnedSafeSubItem safeItem={safeItem} />)

    expect(screen.queryByTestId('pending-activation-icon')).not.toBeInTheDocument()
    expect(screen.getByText(/42/)).toBeInTheDocument()
  })
})
