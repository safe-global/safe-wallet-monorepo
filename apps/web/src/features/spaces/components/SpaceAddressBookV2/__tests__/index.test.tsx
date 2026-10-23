import { faker } from '@faker-js/faker'
import userEvent from '@testing-library/user-event'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type {
  AddressBookRequestItemDto,
  SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  useAddressBookRequestsState,
  useIsAdmin,
  useIsInvited,
  useMemberNameResolver,
  useSpaceAddressBookState,
} from '@/features/spaces'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { Builder } from '@/tests/Builder'
import { chainBuilder } from '@/tests/builders/chains'
import { getStoreInstance } from '@/store'
import type * as Store from '@/store'
import type * as AddressBookSlice from '@/store/addressBookSlice'
import { render, screen, waitFor, within } from '@/tests/test-utils'
import type { AddressBookState } from '@/store/addressBookSlice'
import { downloadCsv } from '../../../utils/addressBookCsv'
import SpaceAddressBookV2 from '../index'

const SPACE_ID = '7'

const mockIsMobile = jest.fn(() => false)
jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: () => mockIsMobile() }))
jest.mock('@/features/spaces', () => ({
  useIsAdmin: jest.fn(),
  useIsInvited: jest.fn(),
  useSpaceAddressBookState: jest.fn(),
  useAddressBookRequestsState: jest.fn(),
  useMemberNameResolver: jest.fn(),
  useCurrentSpaceId: jest.fn(() => SPACE_ID),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
}))
const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))
jest.mock('../../../utils/addressBookCsv', () => ({
  ...jest.requireActual('../../../utils/addressBookCsv'),
  downloadCsv: jest.fn(),
}))
jest.mock('@/components/common/Identicon', () => {
  const Identicon = () => <span data-testid="identicon" />
  return Identicon
})
jest.mock('../../InviteBanner/PreviewInvite', () => {
  const PreviewInvite = () => <div>Invite preview</div>
  return PreviewInvite
})
jest.mock('../../SpaceAddressBook/AddContact', () => {
  const AddContact = ({ label }: { label?: string }) => <button>{label}</button>
  return AddContact
})
jest.mock('../../SpaceAddressBook/Import', () => {
  const ImportAddressBook = () => <button>Import</button>
  return ImportAddressBook
})
jest.mock('../../SpaceAddressBook/AddLocalContact', () => {
  const AddLocalContact = () => <button>Add local contact</button>
  return AddLocalContact
})
jest.mock('../../SpaceAddressBook/PendingRequestsTable', () => {
  const PendingRequestsTable = ({ requests }: { requests: unknown[] }) => (
    <div data-testid="pending-table">{requests.length} pending</div>
  )
  return PendingRequestsTable
})
jest.mock('../../SpaceAddressBook/EditContactDialog', () => {
  const EditContactDialog = ({ entry }: { entry: { name: string } }) => <div role="dialog">Editing {entry.name}</div>
  return EditContactDialog
})
jest.mock('../../SpaceAddressBook/DeleteContactDialog', () => {
  const DeleteContactDialog = ({ name, networks }: { name: string; networks: string[] }) => (
    <div role="dialog">
      Deleting {name} on {networks.join(',')}
    </div>
  )
  return DeleteContactDialog
})
jest.mock('../../SpaceAddressBook/AddToWorkspaceButton', () => {
  const AddToWorkspaceButton = ({ name, chainIds }: { name: string; chainIds: string[] }) => (
    <button>
      Add {name} to Workspace on {chainIds.join(',')}
    </button>
  )
  return AddToWorkspaceButton
})
jest.mock('../../SpaceAddressBook/RequestToAddButton', () => {
  const RequestToAddButton = ({ name, alreadyRequested }: { name: string; alreadyRequested?: boolean }) => (
    <button>{alreadyRequested ? `${name} requested` : `Request ${name}`}</button>
  )
  return RequestToAddButton
})
jest.mock('@/components/address-book/EntryDialog', () => {
  const { useAppDispatch } = jest.requireActual<typeof Store>('@/store')
  const { upsertAddressBookEntries } = jest.requireActual<typeof AddressBookSlice>('@/store/addressBookSlice')
  const EntryDialog = ({
    handleClose,
    defaultValues,
    chainIds,
  }: {
    handleClose: () => void
    defaultValues: { name: string; address: string }
    chainIds: string[]
  }) => {
    const dispatch = useAppDispatch()
    const save = () => {
      dispatch(upsertAddressBookEntries({ chainIds, address: defaultValues.address, name: 'Renamed' }))
      handleClose()
    }
    return (
      <div role="dialog">
        Editing local {defaultValues.name} on {chainIds.join(',')}
        <button onClick={save}>Save</button>
        <button onClick={handleClose}>Cancel</button>
      </div>
    )
  }
  return EntryDialog
})

const itemBuilder = () =>
  Builder.new<SpaceAddressBookItemDto>().with({
    name: faker.person.fullName(),
    address: checksumAddress(faker.finance.ethereumAddress()),
    chainIds: ['1'],
    createdBy: faker.internet.email(),
    createdByUserId: faker.number.int(),
    lastUpdatedBy: faker.internet.email(),
    lastUpdatedByUserId: faker.number.int(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  })

const requestBuilder = () =>
  Builder.new<AddressBookRequestItemDto>().with({
    id: faker.number.int(),
    name: faker.person.fullName(),
    address: checksumAddress(faker.finance.ethereumAddress()),
    chainIds: ['1'],
    requestedBy: faker.internet.email(),
    requestedByUserId: faker.number.int(),
    reviewedBy: null,
    reviewedByUserId: null,
    status: 'PENDING',
    createdAt: faker.date.recent().toISOString(),
  })

const SETTLED = { isLoading: false, isError: false }

const EXPLORER = 'https://explorer.test/address/'
const currentChain = chainBuilder()
  .with({ blockExplorerUriTemplate: { address: `${EXPLORER}{{address}}`, txHash: '', api: '' } })
  .build()

const mockWorkspaceBook = (state: Partial<ReturnType<typeof useSpaceAddressBookState>> = {}) => {
  const refetch = jest.fn()
  ;(useSpaceAddressBookState as jest.Mock).mockReturnValue({ items: [], ...SETTLED, refetch, ...state })
  return refetch
}

const mockRequests = (state: Partial<ReturnType<typeof useAddressBookRequestsState>> = {}) => {
  ;(useAddressBookRequestsState as jest.Mock).mockReturnValue({ items: [], ...SETTLED, refetch: jest.fn(), ...state })
}

const mockRole = (role: 'admin' | 'member' | 'invited') => {
  ;(useIsAdmin as jest.Mock).mockReturnValue(role === 'admin')
  ;(useIsInvited as jest.Mock).mockReturnValue(role === 'invited')
}

const mockPrivateAddressBook = (enabled: boolean) =>
  (useHasFeature as jest.Mock).mockImplementation((feature: FEATURES) =>
    feature === FEATURES.PRIVATE_ADDRESS_BOOK ? enabled : false,
  )

const renderAddressBook = (localBook: AddressBookState = {}) =>
  render(<SpaceAddressBookV2 />, { initialReduxState: { addressBook: localBook } })

const rowOf = (name: string) => {
  const row = screen.getAllByTestId('table-row').find((tableRow) => within(tableRow).queryByText(name))
  if (!row) throw new Error(`No row for ${name}`)
  return row
}

const openRowMenu = async (name: string) => {
  await userEvent.click(screen.getByRole('button', { name: `Actions for ${name}` }))
  await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
}

const localBook = () => getStoreInstance().getState().addressBook

const openLocalTab = () => userEvent.click(screen.getByRole('tab', { name: /^Local contacts/ }))

describe('SpaceAddressBookV2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    mockIsMobile.mockReturnValue(false)
    mockRole('admin')
    mockPrivateAddressBook(true)
    mockWorkspaceBook()
    mockRequests()
    ;(useMemberNameResolver as jest.Mock).mockReturnValue(() => undefined)
    ;(useCurrentChain as jest.Mock).mockReturnValue(currentChain)
  })

  describe('workspace contacts', () => {
    it('shows the loading state while the book loads', () => {
      mockWorkspaceBook({ isLoading: true })

      renderAddressBook()

      expect(screen.getByTestId('address-book-loading')).toBeInTheDocument()
    })

    it('reloads the book after it failed to load', async () => {
      const refetch = mockWorkspaceBook({ isError: true })

      renderAddressBook()
      await userEvent.click(within(screen.getByTestId('address-book-error')).getByRole('button', { name: 'Reload' }))

      expect(refetch).toHaveBeenCalledTimes(1)
    })

    it('lists every contact with its full address and who added it', () => {
      const treasury = itemBuilder().with({ name: 'Treasury', createdByUserId: 3 }).build()
      mockWorkspaceBook({ items: [treasury, itemBuilder().with({ name: 'Payroll' }).build()] })
      ;(useMemberNameResolver as jest.Mock).mockReturnValue((userId?: number) =>
        userId === 3 ? 'Maya Chen' : undefined,
      )

      renderAddressBook()

      expect(screen.getByRole('tab', { name: 'Workspace contacts (2)' })).toBeInTheDocument()
      expect(within(rowOf('Treasury')).getByTestId('grouped-address')).toHaveTextContent(treasury.address)
      expect(within(rowOf('Treasury')).getByText('Maya Chen')).toBeInTheDocument()
    })

    it("links each contact to the current chain's explorer", () => {
      const treasury = itemBuilder().with({ name: 'Treasury' }).build()
      mockWorkspaceBook({ items: [treasury] })

      renderAddressBook()

      expect(within(rowOf('Treasury')).getByRole('link')).toHaveAttribute('href', `${EXPLORER}${treasury.address}`)
    })

    it('gives admins Import, Export, Add contact and the row menu', () => {
      mockWorkspaceBook({ items: [itemBuilder().with({ name: 'Treasury' }).build()] })

      renderAddressBook()

      expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add contact' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Actions for Treasury' })).toBeInTheDocument()
    })

    it('gives members Export only', () => {
      mockRole('member')
      mockWorkspaceBook({ items: [itemBuilder().with({ name: 'Treasury' }).build()] })

      renderAddressBook()

      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Add contact' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Actions for Treasury' })).not.toBeInTheDocument()
    })

    it('gives an invited person no actions', () => {
      mockRole('invited')
      mockWorkspaceBook({ items: [itemBuilder().with({ name: 'Treasury' }).build()] })

      renderAddressBook()

      expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Add contact' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Actions for Treasury' })).not.toBeInTheDocument()
    })

    it('shows the invite preview to invitees only', () => {
      mockRole('invited')

      renderAddressBook()

      expect(screen.getByText('Invite preview')).toBeInTheDocument()
    })

    it('opens the edit dialog for the row contact', async () => {
      mockWorkspaceBook({ items: [itemBuilder().with({ name: 'Treasury' }).build()] })

      renderAddressBook()
      await openRowMenu('Treasury')
      await userEvent.click(screen.getByRole('menuitem', { name: 'Edit contact' }))

      expect(screen.getByRole('dialog')).toHaveTextContent('Editing Treasury')
    })

    it('opens the delete dialog with every chain of the contact', async () => {
      mockWorkspaceBook({
        items: [
          itemBuilder()
            .with({ name: 'Treasury', chainIds: ['1', '100'] })
            .build(),
        ],
      })

      renderAddressBook()
      await openRowMenu('Treasury')
      await userEvent.click(screen.getByRole('menuitem', { name: 'Delete contact' }))

      expect(screen.getByRole('dialog')).toHaveTextContent('Deleting Treasury on 1,100')
    })

    it('narrows the list to the contacts matching the search', async () => {
      mockWorkspaceBook({
        items: [itemBuilder().with({ name: 'Treasury' }).build(), itemBuilder().with({ name: 'Payroll' }).build()],
      })

      renderAddressBook()
      await userEvent.type(screen.getByRole('searchbox'), 'payr')

      expect(screen.getAllByTestId('table-row')).toHaveLength(1)
      expect(rowOf('Payroll')).toBeInTheDocument()
    })

    it('offers to clear a search that matches nothing', async () => {
      mockWorkspaceBook({ items: [itemBuilder().with({ name: 'Treasury' }).build()] })

      renderAddressBook()
      await userEvent.type(screen.getByRole('searchbox'), 'nothing like it')
      await userEvent.click(within(screen.getByTestId('address-book-no-results')).getByRole('button'))

      expect(rowOf('Treasury')).toBeInTheDocument()
    })

    it('invites admins to add the first contact', () => {
      renderAddressBook()

      const emptyState = screen.getByTestId('address-book-empty')
      expect(within(emptyState).getByRole('button', { name: 'Add contact' })).toBeInTheDocument()
      expect(within(emptyState).getByRole('button', { name: 'Import' })).toBeInTheDocument()
    })

    it('offers members no action on an empty book', () => {
      mockRole('member')

      renderAddressBook()

      expect(within(screen.getByTestId('address-book-empty')).queryByRole('button')).not.toBeInTheDocument()
    })

    it('exports the whole book as CSV, one row per chain', async () => {
      const item = itemBuilder()
        .with({ name: 'Treasury', chainIds: ['1', '100'] })
        .build()
      mockWorkspaceBook({ items: [item] })

      renderAddressBook()
      await userEvent.click(screen.getByRole('button', { name: 'Export' }))

      const [fileName, csv] = (downloadCsv as jest.Mock).mock.calls[0]
      expect(fileName).toBe(`workspace-${SPACE_ID}-address-book.csv`)
      expect(csv.split(/\r?\n/)).toEqual([
        'address,name,chainId',
        `${item.address},Treasury,1`,
        `${item.address},Treasury,100`,
      ])
    })

    it('tracks the export', async () => {
      mockWorkspaceBook({ items: [itemBuilder().build()] })

      renderAddressBook()
      await userEvent.click(screen.getByRole('button', { name: 'Export' }))

      expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining(SPACE_EVENTS.EXPORT_ADDRESS_BOOK), undefined)
    })
  })

  describe('tabs', () => {
    it('shows only the workspace contacts without the private address book', () => {
      mockPrivateAddressBook(false)

      renderAddressBook()

      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Workspace contacts (0)'])
    })

    it('shows the pending requests', async () => {
      mockRequests({ items: [requestBuilder().build(), requestBuilder().build()] })

      renderAddressBook()
      await userEvent.click(screen.getByRole('tab', { name: 'Pending (2)' }))

      expect(screen.getByTestId('pending-table')).toHaveTextContent('2 pending')
    })

    it('shows the loading state while the requests load', async () => {
      mockRequests({ isLoading: true })

      renderAddressBook()
      await userEvent.click(screen.getByRole('tab', { name: 'Pending' }))

      expect(screen.getByTestId('pending-requests-loading')).toBeInTheDocument()
    })

    it('starts the search over on another tab', async () => {
      mockWorkspaceBook({ items: [itemBuilder().with({ name: 'Treasury' }).build()] })

      renderAddressBook({ '1': { [checksumAddress(faker.finance.ethereumAddress())]: 'Hardware wallet' } })
      await userEvent.type(screen.getByRole('searchbox'), 'treas')
      await openLocalTab()

      expect(screen.getByRole('searchbox')).toHaveValue('')
    })
  })

  describe('local contacts', () => {
    const hardwareWallet = checksumAddress(faker.finance.ethereumAddress())

    it('merges a local contact saved on several chains into one row', async () => {
      renderAddressBook({
        '1': { [hardwareWallet]: 'Hardware wallet' },
        '100': { [hardwareWallet]: 'Hardware wallet' },
      })
      await openLocalTab()

      expect(screen.getByRole('tab', { name: 'Local contacts (1)' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Hardware wallet to Workspace on 1,100' })).toBeInTheDocument()
    })

    it("links each local contact to the current chain's explorer", async () => {
      renderAddressBook({ '1': { [hardwareWallet]: 'Hardware wallet' } })
      await openLocalTab()

      expect(within(rowOf('Hardware wallet')).getByRole('link')).toHaveAttribute('href', `${EXPLORER}${hardwareWallet}`)
    })

    it('offers members to request a contact, showing ones already requested', async () => {
      mockRole('member')
      const requested = checksumAddress(faker.finance.ethereumAddress())
      mockRequests({ items: [requestBuilder().with({ address: requested.toLowerCase() }).build()] })

      renderAddressBook({ '1': { [hardwareWallet]: 'Hardware wallet', [requested]: 'Vendor' } })
      await openLocalTab()

      expect(screen.getByRole('button', { name: 'Request Hardware wallet' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Vendor requested' })).toBeInTheDocument()
    })

    it('offers invitees no way to share a contact', async () => {
      mockRole('invited')

      renderAddressBook({ '1': { [hardwareWallet]: 'Hardware wallet' } })
      await openLocalTab()

      expect(screen.queryByRole('button', { name: /^(Add|Request) Hardware wallet/ })).not.toBeInTheDocument()
    })

    it('marks a contact the Workspace already has as shared', async () => {
      mockWorkspaceBook({ items: [itemBuilder().with({ address: hardwareWallet.toLowerCase() }).build()] })

      renderAddressBook({ '1': { [hardwareWallet]: 'Hardware wallet' } })
      await openLocalTab()

      expect(within(rowOf('Hardware wallet')).getByText('Already shared')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Add Hardware wallet/ })).not.toBeInTheDocument()
    })

    it('says a contact is already shared in words in the compact layout', async () => {
      mockIsMobile.mockReturnValue(true)
      mockWorkspaceBook({ items: [itemBuilder().with({ address: hardwareWallet.toLowerCase() }).build()] })

      renderAddressBook({ '1': { [hardwareWallet]: 'Hardware wallet' } })
      await openLocalTab()

      expect(within(rowOf('Hardware wallet')).getByText('Already shared')).toBeInTheDocument()
    })

    it('holds the share action back until the workspace book is read', async () => {
      mockWorkspaceBook({ isLoading: true })

      renderAddressBook({ '1': { [hardwareWallet]: 'Hardware wallet' } })
      await openLocalTab()

      expect(screen.queryByRole('button', { name: /^Add Hardware wallet/ })).not.toBeInTheDocument()
    })

    it('edits a local contact on all its chains', async () => {
      mockRole('member')

      renderAddressBook({
        '1': { [hardwareWallet]: 'Hardware wallet' },
        '100': { [hardwareWallet]: 'Hardware wallet' },
      })
      await openLocalTab()
      await openRowMenu('Hardware wallet')
      await userEvent.click(screen.getByRole('menuitem', { name: 'Edit contact' }))

      expect(screen.getByRole('dialog')).toHaveTextContent('Editing local Hardware wallet on 1,100')
    })

    it('deletes a local contact from every chain', async () => {
      renderAddressBook({
        '1': { [hardwareWallet]: 'Hardware wallet' },
        '100': { [hardwareWallet]: 'Hardware wallet' },
      })
      await openLocalTab()
      await openRowMenu('Hardware wallet')
      await userEvent.click(screen.getByRole('menuitem', { name: 'Delete contact' }))
      await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }))

      expect(await screen.findByTestId('address-book-empty')).toHaveTextContent('No local contacts yet')
      expect(screen.getByRole('tab', { name: 'Local contacts (0)' })).toBeInTheDocument()
    })

    it('deletes a local contact saved under several casings of its address', async () => {
      renderAddressBook({
        '1': { [hardwareWallet]: 'Hardware wallet', [hardwareWallet.toLowerCase()]: 'Hardware wallet' },
        '100': { [hardwareWallet.toLowerCase()]: 'Hardware wallet' },
      })
      await openLocalTab()
      await openRowMenu('Hardware wallet')
      await userEvent.click(screen.getByRole('menuitem', { name: 'Delete contact' }))
      await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }))

      expect(await screen.findByTestId('address-book-empty')).toBeInTheDocument()
      expect(localBook()).toEqual({})
    })

    it('renames a local contact saved under several casings to one entry per chain', async () => {
      renderAddressBook({
        '1': { [hardwareWallet]: 'Hardware wallet' },
        '100': { [hardwareWallet.toLowerCase()]: 'Hardware wallet', [hardwareWallet]: 'Hardware wallet' },
      })
      await openLocalTab()
      await openRowMenu('Hardware wallet')
      await userEvent.click(screen.getByRole('menuitem', { name: 'Edit contact' }))
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }))

      expect(localBook()).toEqual({
        '1': { [hardwareWallet]: 'Renamed' },
        '100': { [hardwareWallet]: 'Renamed' },
      })
    })

    it('leaves the local address book as it was when an edit is cancelled', async () => {
      const book = {
        '1': { [hardwareWallet]: 'Hardware wallet' },
        '100': { [hardwareWallet.toLowerCase()]: 'Hardware wallet' },
      }
      renderAddressBook(book)
      await openLocalTab()
      await openRowMenu('Hardware wallet')
      await userEvent.click(screen.getByRole('menuitem', { name: 'Edit contact' }))
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

      expect(localBook()).toEqual(book)
    })

    it('offers to add the first local contact', async () => {
      renderAddressBook()
      await openLocalTab()

      expect(
        within(screen.getByTestId('address-book-empty')).getByRole('button', { name: 'Add local contact' }),
      ).toBeInTheDocument()
    })
  })
})
