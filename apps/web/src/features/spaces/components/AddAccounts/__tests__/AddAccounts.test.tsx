import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import AddAccounts from '../index'

jest.mock('@/features/address-poisoning', () => ({
  useSimilarityClusters: () => ({ flagged: new Set<string>(), groupIdByAddress: new Map<string, string>() }),
}))

jest.mock('../AddManually', () => ({
  __esModule: true,
  default: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="add-manually" data-disabled={String(!!disabled)} />
  ),
}))

// The heavy accounts table is exercised in its own suite; here we only need to observe the items it receives.
jest.mock('@/features/myAccounts', () => ({
  __esModule: true,
  SafeAccountsTable: (props: {
    items: Array<{ chainId: string; address: string }>
    selection?: { onToggle: (line: unknown, next: boolean) => void; isAtLimit?: boolean }
  }) => (
    <div
      data-testid="safe-accounts-table"
      data-count={props.items.length}
      data-locked={String(Boolean(props.selection?.isAtLimit))}
      onClick={() => {
        const [item] = props.items
        props.selection?.onToggle({ key: `${item.chainId}:${item.address}`, variant: 'single', source: item }, true)
      }}
    />
  ),
}))

const mockTrustedOpen = jest.fn()
const mockTrustedClose = jest.fn()
jest.mock('@/components/common/TrustedSafesModal/useTrustedSafesModal', () => ({
  __esModule: true,
  default: () => ({ open: mockTrustedOpen, close: mockTrustedClose, isOpen: false }),
}))

jest.mock('@/components/common/TrustedSafesModal/ManageTrustedSafesContent', () => ({
  __esModule: true,
  default: ({ onSecondary, onSaved }: { onSecondary: () => void; onSaved?: () => void }) => (
    <div data-testid="manage-trusted-content">
      <button data-testid="manage-content-back" onClick={onSecondary}>
        content-back
      </button>
      <button data-testid="manage-content-save" onClick={() => onSaved?.()}>
        content-save
      </button>
    </div>
  ),
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

let mockWalletValue: { address: string } | null = { address: '0xWallet' }
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockWalletValue,
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1' }] }),
}))

let mockAllOwned: Record<string, string[]> = {}
const mockUseAllOwnedSafes = jest.fn<readonly [Record<string, string[]>, boolean], [string]>(() => [
  mockAllOwned,
  false,
])
jest.mock('@/hooks/safes', () => {
  const actual = jest.requireActual('@/hooks/safes')
  return {
    ...actual,
    useAllOwnedSafes: (address: string) => mockUseAllOwnedSafes(address),
    useSafesSearch: (safes: unknown) => safes,
  }
})

let mockIsAdmin = true
let mockSpaceSafes: Array<{ chainId: string; address: string }> = []
let mockSpaceSafesLoading = false
let mockSafeLimit: { limit: number | null | undefined; isError: boolean } = { limit: 40, isError: false }
const mockRetryLimit = jest.fn()
jest.mock('../../../hooks/useSpaceSafeLimit', () => ({
  useSpaceSafeLimit: () => ({ ...mockSafeLimit, isLoading: false, retry: mockRetryLimit }),
}))
jest.mock('../../../hooks/useSeatUpsell', () => ({
  useSeatUpsell: () => ({ isSafePro: false, tierName: undefined, limit: null, plansHref: '/spaces/plans' }),
}))

let mockSpaceAddressBook: Array<{ address: string; name: string; chainIds: string[] }> = []
let mockAddressBookError = false
const mockUpsertWorkspaceNames = jest.fn().mockResolvedValue({})
jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '1',
  useIsAdmin: () => mockIsAdmin,
  useSpaceSafes: () => ({ allSafes: mockSpaceSafes, isLoading: mockSpaceSafesLoading }),
  useIsQualifiedSafe: () => false,
  useSpaceAddressBookState: () => ({ items: mockSpaceAddressBook, isLoading: false, isError: mockAddressBookError }),
  useUpsertWorkspaceSafeNames: () => mockUpsertWorkspaceNames,
  getChainIdsParam: () => '',
}))

// The naming fields are covered by their own suite; this stub enters a name through the shared form.
let mockEnteredName = 'Treasury'
jest.mock('../../NameAccounts', () => ({
  ...jest.requireActual('../../NameAccounts'),
  NameAccountsFields: ({ items }: { items: Array<{ address: string }> }) => {
    const { useEffect } = require('react')
    const { useFormContext } = require('react-hook-form')
    const { setValue } = useFormContext()
    useEffect(() => {
      items.forEach((item) => setValue(`names.${item.address.toLowerCase()}`, mockEnteredName))
    }, [items, setValue])
    return <div data-testid="name-accounts-fields" data-count={items.length} />
  },
}))

const mockAddSafesToSpace = jest.fn()
const mockRemoveSafesFromSpace = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: () => [mockAddSafesToSpace, {}],
  useSpaceSafesDeleteV1Mutation: () => [mockRemoveSafesFromSpace, {}],
}))

const TRUSTED_ADDRESS = '0x0000000000000000000000000000000000001234'
const withTrusted = {
  initialReduxState: {
    addedSafes: { '1': { [TRUSTED_ADDRESS]: { owners: [], threshold: 1 } } },
  },
}

describe('AddAccounts — wallet connection state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
    mockIsAdmin = true
    mockSpaceSafes = []
    mockSpaceSafesLoading = false
  })

  it('shows trusted safes in the list', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)
    expect(screen.getByTestId('safe-accounts-table')).toHaveAttribute('data-count', '1')
  })

  // Owned-safes enumeration (the captcha-protected owners endpoint) is deferred until the modal
  // opens: while closed the hook is called with an empty address so the request is skipped.
  it('does not enumerate owned safes while the modal is closed', () => {
    render(<AddAccounts />)

    expect(mockUseAllOwnedSafes).toHaveBeenCalledWith('')
    expect(mockUseAllOwnedSafes).not.toHaveBeenCalledWith('0xWallet')
  })

  it('enumerates owned safes once the modal is open', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(mockUseAllOwnedSafes).toHaveBeenCalledWith('0xWallet')
  })

  it('renders the "What are trusted Safe accounts?" info banner with a Manage list action', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(screen.getByText('What are my accounts?')).toBeInTheDocument()
    expect(screen.getByText(/This list protects you from impersonation\./)).toBeInTheDocument()
    expect(screen.getByTestId('open-manage-trusted-safes')).toHaveTextContent('Manage list')
  })

  it('keeps trusted safes that are already in the workspace in the list (shown pre-checked)', () => {
    // The trusted safe is also already part of the current space — it must still appear (not filtered out).
    mockSpaceSafes = [{ chainId: '1', address: TRUSTED_ADDRESS }]
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)
    expect(screen.getByTestId('safe-accounts-table')).toHaveAttribute('data-count', '1')
  })

  it('keeps the manual add affordance available', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)
    expect(screen.getByTestId('add-manually')).toBeInTheDocument()
  })
})

describe('AddAccounts — Safe account limit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
    mockIsAdmin = true
    mockSpaceSafes = []
    mockSpaceSafesLoading = false
    mockSafeLimit = { limit: 40, isError: false }
  })

  it('counts against a known limit and leaves picking open below it', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    expect(screen.getByTestId('selected-count')).toHaveTextContent('0 of 40 selected')
    expect(screen.getByTestId('safe-accounts-table')).toHaveAttribute('data-locked', 'false')
    expect(screen.getByTestId('add-manually')).toHaveAttribute('data-disabled', 'false')
  })

  it('shows no limit and locks picking while the limit is unknown', () => {
    mockSafeLimit = { limit: undefined, isError: false }
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    expect(screen.getByTestId('selected-count')).toHaveTextContent(/^\s*0 selected$/)
    expect(screen.getByTestId('safe-accounts-table')).toHaveAttribute('data-locked', 'true')
    expect(screen.getByTestId('add-manually')).toHaveAttribute('data-disabled', 'true')
    expect(screen.queryByTestId('safe-limit-error')).not.toBeInTheDocument()
  })

  it('offers a retry when the limit fails to load', () => {
    mockSafeLimit = { limit: undefined, isError: true }
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(mockRetryLimit).toHaveBeenCalled()
  })
})

describe('AddAccounts — manage trusted safes view switch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
    mockIsAdmin = true
    mockSpaceSafes = []
    mockSpaceSafesLoading = false
  })

  it('switches to the manage view and back', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    // Starts on the picker
    expect(screen.getByText('My accounts')).toBeInTheDocument()
    expect(screen.queryByTestId('manage-trusted-content')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('open-manage-trusted-safes'))

    expect(mockTrustedOpen).toHaveBeenCalled()
    expect(screen.getByTestId('manage-trusted-content')).toBeInTheDocument()
    expect(screen.getByText('Manage my account list')).toBeInTheDocument()

    // Header back returns to the picker without saving
    fireEvent.click(screen.getByTestId('manage-trusted-back'))
    expect(mockTrustedClose).toHaveBeenCalled()
    expect(screen.queryByTestId('manage-trusted-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('safe-accounts-table')).toBeInTheDocument()
  })

  it('returns to the picker after saving in the manage view', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    fireEvent.click(screen.getByTestId('open-manage-trusted-safes'))
    fireEvent.click(screen.getByTestId('manage-content-save'))

    expect(screen.queryByTestId('manage-trusted-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('safe-accounts-table')).toBeInTheDocument()
  })
})

describe('AddAccounts — admin guard on submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
    mockIsAdmin = true
    mockSpaceSafes = []
    mockSpaceSafesLoading = false
  })

  it('blocks submission and shows an error when the user is not an admin', async () => {
    mockIsAdmin = false
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    const form = screen.getByTestId('add-accounts-button').closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    expect(await screen.findByText('Only admins can add or remove Safe accounts in this Workspace')).toBeInTheDocument()
    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
    expect(mockRemoveSafesFromSpace).not.toHaveBeenCalled()
  })

  it('disables the trigger button when the user is not an admin', () => {
    mockIsAdmin = false
    render(<AddAccounts />)
    expect(screen.getByTestId('add-space-account-button')).toBeDisabled()
  })

  it('enables the trigger button when the user is an admin', () => {
    mockIsAdmin = true
    render(<AddAccounts />)
    expect(screen.getByTestId('add-space-account-button')).not.toBeDisabled()
  })

  it('does not show the admin error and does not call mutations when an admin submits an empty form', async () => {
    mockIsAdmin = true
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    const form = screen.getByTestId('add-accounts-button').closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    expect(screen.queryByText('Only admins can add or remove Safe accounts in this Workspace')).not.toBeInTheDocument()
    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
    expect(mockRemoveSafesFromSpace).not.toHaveBeenCalled()
  })

  it('does not diff existing members as removals when the modal opens before space safes load', () => {
    // Cold cache: the modal opens (via the chooser) while the space-safes query is still in flight.
    mockSpaceSafesLoading = true
    mockSpaceSafes = []
    const { rerender } = render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    // The query resolves with an existing member. The reset must now seed it (pre-checked), so Save
    // sees no changes rather than treating the member as a removal (which would delete it on submit).
    mockSpaceSafesLoading = false
    mockSpaceSafes = [{ chainId: '1', address: TRUSTED_ADDRESS }]
    rerender(<AddAccounts externalOpen onExternalClose={() => {}} />)

    // Form is clean (nothing to add or remove) → Save disabled. If the empty seed had been finalized,
    // the member would diff as a removal and the button would be enabled.
    expect(screen.getByTestId('add-accounts-button')).toBeDisabled()
  })
})

describe('AddAccounts — naming step', () => {
  const selectTrusted = () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)
    // The table is stubbed, so select through the form the same way a checkbox toggle would.
    const form = screen.getByTestId('add-accounts-button').closest('form')!
    return form
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
    mockIsAdmin = true
    mockSpaceSafes = []
    mockSpaceSafesLoading = false
    mockSpaceAddressBook = []
    mockAddressBookError = false
    mockEnteredName = 'Treasury'
    mockAddSafesToSpace.mockResolvedValue({ data: {} })
    mockUpsertWorkspaceNames.mockResolvedValue({})
  })

  it.each([
    ['empty', ''],
    ['too short to save', 'ab'],
  ])('keeps submit enabled but does not submit while a name is %s', async (_, name) => {
    mockEnteredName = name
    const form = selectTrusted()
    fireEvent.click(screen.getByTestId('safe-accounts-table'))
    fireEvent.submit(form)
    await screen.findByText('Name your Safe accounts')

    expect(screen.getByTestId('add-accounts-button')).not.toBeDisabled()
    fireEvent.submit(screen.getByTestId('add-accounts-button').closest('form')!)

    await waitFor(() => expect(mockUpsertWorkspaceNames).not.toHaveBeenCalled())
    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
  })

  it('blocks submit while the address book could not be read', async () => {
    mockAddressBookError = true
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)
    fireEvent.click(screen.getByTestId('safe-accounts-table'))

    await waitFor(() => expect(screen.getByTestId('add-accounts-button')).toBeDisabled())
    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
  })

  it('opens the naming view instead of submitting when a selected Safe has no workspace name', async () => {
    const form = selectTrusted()
    fireEvent.click(screen.getByTestId('safe-accounts-table'))
    fireEvent.submit(form)

    expect(await screen.findByText('Name your Safe accounts')).toBeInTheDocument()
    expect(screen.getByTestId('name-accounts-fields')).toHaveAttribute('data-count', '1')
    expect(screen.queryByTestId('safe-accounts-table')).not.toBeInTheDocument()
    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
  })

  it('adds the Safes and then writes the names on submit from the naming view', async () => {
    const form = selectTrusted()
    fireEvent.click(screen.getByTestId('safe-accounts-table'))
    fireEvent.submit(form)
    await screen.findByText('Name your Safe accounts')

    fireEvent.submit(screen.getByTestId('add-accounts-button').closest('form')!)

    await waitFor(() => expect(mockUpsertWorkspaceNames).toHaveBeenCalled())
    expect(mockAddSafesToSpace).toHaveBeenCalledWith({
      spaceId: '1',
      createSpaceSafesDto: { safes: [{ chainId: '1', address: TRUSTED_ADDRESS }] },
    })
    expect(mockUpsertWorkspaceNames).toHaveBeenCalledWith([
      { address: TRUSTED_ADDRESS, name: 'Treasury', chainIds: ['1'] },
    ])
  })

  it('submits directly when the workspace already names the selected Safe', async () => {
    mockSpaceAddressBook = [{ address: TRUSTED_ADDRESS, name: 'Named', chainIds: ['1'] }]
    const form = selectTrusted()
    fireEvent.click(screen.getByTestId('safe-accounts-table'))
    fireEvent.submit(form)

    await waitFor(() => expect(mockAddSafesToSpace).toHaveBeenCalled())
    expect(screen.queryByText('Name your Safe accounts')).not.toBeInTheDocument()
  })

  it('surfaces a failed name write and keeps the dialog on the naming view', async () => {
    mockUpsertWorkspaceNames.mockResolvedValue({ error: 'Forbidden' })
    const form = selectTrusted()
    fireEvent.click(screen.getByTestId('safe-accounts-table'))
    fireEvent.submit(form)
    await screen.findByText('Name your Safe accounts')

    fireEvent.submit(screen.getByTestId('add-accounts-button').closest('form')!)

    expect(await screen.findByText('Forbidden')).toBeInTheDocument()
    expect(screen.getByTestId('name-accounts-region')).toBeInTheDocument()
  })

  it('still writes the names when a retry finds the Safes already added', async () => {
    mockUpsertWorkspaceNames.mockResolvedValueOnce({ error: 'Forbidden' })
    const form = selectTrusted()
    fireEvent.click(screen.getByTestId('safe-accounts-table'))
    fireEvent.submit(form)
    await screen.findByText('Name your Safe accounts')

    fireEvent.submit(screen.getByTestId('add-accounts-button').closest('form')!)
    await screen.findByText('Forbidden')

    // The add succeeded, so the retry has nothing left to add.
    mockSpaceSafes = [{ chainId: '1', address: TRUSTED_ADDRESS }]
    fireEvent.submit(screen.getByTestId('add-accounts-button').closest('form')!)

    await waitFor(() => expect(mockUpsertWorkspaceNames).toHaveBeenCalledTimes(2))
    expect(mockUpsertWorkspaceNames).toHaveBeenLastCalledWith([
      { address: TRUSTED_ADDRESS, name: 'Treasury', chainIds: ['1'] },
    ])
  })

  it('keeps the naming step submittable after the Safes are already added', async () => {
    mockUpsertWorkspaceNames.mockResolvedValueOnce({ error: 'Forbidden' })
    const { rerender } = render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)
    const form = screen.getByTestId('add-accounts-button').closest('form')!
    fireEvent.click(screen.getByTestId('safe-accounts-table'))
    fireEvent.submit(form)
    await screen.findByText('Name your Safe accounts')

    fireEvent.submit(screen.getByTestId('add-accounts-button').closest('form')!)
    await screen.findByText('Forbidden')

    expect(screen.getByTestId('add-accounts-button')).not.toBeDisabled()

    mockSpaceSafes = [{ chainId: '1', address: TRUSTED_ADDRESS }]
    rerender(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(screen.getByTestId('add-accounts-button')).not.toBeDisabled()
  })

  it('returns to the picker from the naming view', async () => {
    const form = selectTrusted()
    fireEvent.click(screen.getByTestId('safe-accounts-table'))
    fireEvent.submit(form)
    await screen.findByText('Name your Safe accounts')

    fireEvent.click(screen.getByTestId('name-accounts-back'))

    expect(screen.getByText('My accounts')).toBeInTheDocument()
    expect(screen.getByTestId('safe-accounts-table')).toBeInTheDocument()
  })
})
