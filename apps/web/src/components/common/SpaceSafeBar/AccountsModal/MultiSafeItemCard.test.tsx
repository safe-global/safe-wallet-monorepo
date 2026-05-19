import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { useMultiAccountItemData } from '@/features/myAccounts'
import type { MultiChainSafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import MultiSafeItemCard from './MultiSafeItemCard'

jest.mock('@/features/myAccounts', () => ({
  useMultiAccountItemData: jest.fn(),
  usePinActions: () => ({
    addToPinnedList: jest.fn(),
    removeFromPinnedList: jest.fn(),
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

jest.mock('./PinnedSafeItem', () => ({
  PinnedSafeSubItem: ({ safeItem }: { safeItem: { chainId: string; address: string } }) => (
    <div data-testid={`sub-item-${safeItem.chainId}`} />
  ),
}))

jest.mock('@/hooks/useChains', () => ({
  useChain: (chainId: string) => {
    if (chainId === '100') {
      return { chainId: '100', shortName: 'gno', chainName: 'Gnosis', chainLogoUri: '' }
    }
    if (chainId === '1') {
      return { chainId: '1', shortName: 'eth', chainName: 'Ethereum', chainLogoUri: '' }
    }
    return undefined
  },
}))

const sharedAddress = '0x1111111111111111111111111111111111111111'

const buildMultiItem = (): MultiChainSafeItem => ({
  address: sharedAddress,
  safes: [
    safeItemBuilder().with({ chainId: '1', address: sharedAddress }).build(),
    safeItemBuilder().with({ chainId: '100', address: sharedAddress }).build(),
  ],
  isPinned: false,
  lastVisited: 1,
  name: undefined,
})

describe('MultiSafeItemCard', () => {
  const noopClose = jest.fn()

  beforeEach(() => {
    jest.mocked(useMultiAccountItemData).mockReturnValue({
      address: sharedAddress,
      sortedSafes: buildMultiItem().safes,
      safeOverviews: [
        { chainId: '1', address: { value: sharedAddress }, fiatTotal: '10' },
        { chainId: '100', address: { value: sharedAddress }, fiatTotal: '500' },
      ] as SafeOverview[],
      sharedSetup: {
        threshold: 1,
        owners: ['0x0000000000000000000000000000000000000001'],
      },
      totalFiatValue: 510,
      name: undefined,
      hasReplayableSafe: false,
      isPinned: false,
      isCurrentSafe: false,
      isReadOnly: false,
      isWelcomePage: false,
      deployedChainIds: ['1', '100'],
      isSpaceRoute: false,
      isFullyUndeployed: false,
      isActivating: false,
    })
  })

  it('renders collapsed with no per-chain sub-items visible', () => {
    render(<MultiSafeItemCard item={buildMultiItem()} onClose={noopClose} />)

    expect(screen.queryByTestId('sub-item-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sub-item-100')).not.toBeInTheDocument()
  })

  it('expands and shows a sub-item per chain when the trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<MultiSafeItemCard item={buildMultiItem()} onClose={noopClose} />)

    await user.click(screen.getByRole('button', { name: /0x11/i }))

    expect(screen.getByTestId('sub-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('sub-item-100')).toBeInTheDocument()
  })
})
