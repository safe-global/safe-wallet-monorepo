import { render, screen } from '@testing-library/react'
import SpaceSafeAccounts from '../index'

jest.mock('@/features/address-poisoning/hooks/useListSimilarities', () => ({
  __esModule: true,
  default: () => new Map(),
}))

jest.mock('../../AddAccountsChooser', () => ({
  __esModule: true,
  default: ({ buttonLabel, entryPoint }: { buttonLabel?: string; entryPoint?: string }) => (
    <button data-testid="add-accounts-chooser" data-entry-point={entryPoint}>
      {buttonLabel ?? 'Add accounts'}
    </button>
  ),
}))

jest.mock('@/components/common/Track', () => {
  const Track = ({ children }: { children: React.ReactNode }) => <>{children}</>
  Track.displayName = 'Track'
  return Track
})

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: () => ({ allSafes: [], isError: false, error: null, refetch: jest.fn() }),
  useIsInvited: () => false,
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/hooks/safes', () => ({
  useAllOwnedSafes: () => [{}, undefined, false],
  getComparator: () => () => 0,
  useSafeItemBuilder: () => ({
    buildSafeItem: jest.fn(),
    walletAddress: '',
    isWalletConnected: false,
    allOwned: {},
    ownedError: undefined,
    ownedLoading: false,
  }),
  _groupAndSort: () => [],
}))

jest.mock('@/store', () => ({
  useAppSelector: () => ({}),
}))

jest.mock('@/store/orderByPreferenceSlice', () => ({ selectOrderByPreference: jest.fn() }))
jest.mock('@/store/addedSafesSlice', () => ({ selectAllAddedSafes: jest.fn() }))
jest.mock('@/store/slices', () => ({
  selectAllAddressBooks: jest.fn(),
  selectAllVisitedSafes: jest.fn(),
  selectUndeployedSafes: jest.fn(),
}))

jest.mock('../AccountsSafesList', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../EmptySafeAccounts', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../../InviteBanner/PreviewInvite', () => ({ __esModule: true, default: () => null }))

describe('SpaceSafeAccounts header CTA', () => {
  it('renders the AddAccountsChooser with the "Manage accounts" label', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('add-accounts-chooser')).toHaveTextContent('Manage accounts')
  })

  it('passes "safe_accounts" as the entryPoint to AddAccountsChooser', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('add-accounts-chooser')).toHaveAttribute('data-entry-point', 'safe_accounts')
  })
})
