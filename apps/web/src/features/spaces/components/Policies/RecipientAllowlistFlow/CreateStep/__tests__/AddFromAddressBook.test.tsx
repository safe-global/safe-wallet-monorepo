import { faker } from '@faker-js/faker'
import { SENTINEL_ADDRESS, ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { renderWithUserEvent, screen, within } from '@/tests/test-utils'
import { ContactSource, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import useWorkspaceName from '@/components/common/AddressBookInput/useWorkspaceName'
import type { AllowlistRecipient } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import AddFromAddressBook from '../AddFromAddressBook'

jest.mock('@/hooks/useAllAddressBooks', () => ({
  ContactSource: { space: 'space', local: 'local' },
}))
jest.mock('@/components/common/AddressBookInput/useWorkspaceName')

const mockWorkspaceName = useWorkspaceName as jest.MockedFunction<typeof useWorkspaceName>

const CHAIN_ID = '1'
const safeAddress = checksumAddress(faker.finance.ethereumAddress())

const contact = (name: string, source: ContactSource, chainIds = [CHAIN_ID]): ExtendedContact => ({
  name,
  address: checksumAddress(faker.finance.ethereumAddress()),
  chainIds,
  source,
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
})

const setup = (contacts: ExtendedContact[], existing: AllowlistRecipient[] = []) => {
  const onAdd = jest.fn()
  const rendered = renderWithUserEvent(
    <AddFromAddressBook
      chainId={CHAIN_ID}
      safeAddress={safeAddress}
      contacts={contacts}
      existing={existing}
      onAdd={onAdd}
    />,
  )
  return { ...rendered, onAdd }
}

const open = (user: ReturnType<typeof setup>['user']) =>
  user.click(screen.getByRole('button', { name: 'Add from address book' }))

describe('AddFromAddressBook', () => {
  beforeEach(() => {
    mockWorkspaceName.mockReturnValue('Treasury ops')
  })

  it('groups contacts under the Workspace and local headers', async () => {
    const shared = contact('Alice', ContactSource.space)
    const local = contact('Bob', ContactSource.local)
    const { user } = setup([shared, local])

    await open(user)

    expect(screen.getByText('Treasury ops')).toBeInTheDocument()
    expect(screen.getByText('Local contacts')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Add Alice' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Add Bob' })).toBeInTheDocument()
  })

  it('falls back to a generic Workspace label without a workspace name', async () => {
    mockWorkspaceName.mockReturnValue(undefined)
    const { user } = setup([contact('Alice', ContactSource.space)])

    await open(user)

    expect(screen.getByText(/Contacts of\s*your Workspace/)).toBeInTheDocument()
  })

  it('leaves out contacts of other chains and the Safe itself', async () => {
    const otherChain = contact('Elsewhere', ContactSource.space, ['137'])
    const self = { ...contact('Me', ContactSource.local), address: safeAddress.toLowerCase() }
    const { user } = setup([otherChain, self, contact('Alice', ContactSource.space)])

    await open(user)

    expect(screen.queryByRole('checkbox', { name: 'Add Elsewhere' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Add Me' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Add Alice' })).toBeInTheDocument()
  })

  it('leaves out reserved addresses', async () => {
    const zero = { ...contact('Zero', ContactSource.local), address: ZERO_ADDRESS }
    const sentinel = { ...contact('Sentinel', ContactSource.local), address: SENTINEL_ADDRESS }
    const { user } = setup([zero, sentinel, contact('Alice', ContactSource.space)])

    await open(user)

    expect(screen.queryByRole('checkbox', { name: 'Add Zero' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Add Sentinel' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Add Alice' })).toBeInTheDocument()
  })

  it('filters by name and by address', async () => {
    const alice = contact('Alice', ContactSource.space)
    const bob = contact('Bob', ContactSource.local)
    const { user } = setup([alice, bob])

    await open(user)
    await user.type(screen.getByRole('searchbox', { name: 'Search contacts' }), 'alic')
    expect(screen.getByRole('checkbox', { name: 'Add Alice' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Add Bob' })).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Search contacts' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search contacts' }), bob.address)
    expect(screen.getByRole('checkbox', { name: 'Add Bob' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Add Alice' })).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    const { user } = setup([contact('Alice', ContactSource.space)])

    await open(user)
    await user.type(screen.getByRole('searchbox', { name: 'Search contacts' }), 'zzzzzz')

    expect(screen.getByText('No contacts found.')).toBeInTheDocument()
  })

  it('shows selected recipients checked and disabled', async () => {
    const listed = contact('Alice', ContactSource.space)
    const { user } = setup([listed], [{ address: listed.address.toLowerCase(), selected: true }])

    await open(user)

    const checkbox = screen.getByRole('checkbox', { name: 'Add Alice' })
    expect(checkbox).toBeChecked()
    expect(checkbox).toHaveAttribute('aria-disabled', 'true')
  })

  it('lets a deselected recipient be picked again', async () => {
    const listed = contact('Alice', ContactSource.space)
    const { user, onAdd } = setup([listed], [{ address: listed.address, selected: false }])

    await open(user)
    const checkbox = screen.getByRole('checkbox', { name: 'Add Alice' })
    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledWith([
      { name: 'Alice', address: listed.address, fromAddressBook: true, selected: true },
    ])
  })

  it('keeps Add disabled until a contact is picked, then passes the picked contacts', async () => {
    const alice = contact('Alice', ContactSource.space)
    const bob = contact('Bob', ContactSource.local)
    const carol = contact('Carol', ContactSource.local)
    const { user, onAdd } = setup([alice, bob, carol])

    await open(user)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Add' })).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: 'Add Alice' }))
    await user.click(screen.getByRole('checkbox', { name: 'Add Carol' }))
    await user.click(within(dialog).getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledWith([
      { name: 'Alice', address: alice.address, fromAddressBook: true, selected: true },
      { name: 'Carol', address: carol.address, fromAddressBook: true, selected: true },
    ])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('extends the scrolling area under the popup while it is open', async () => {
    const { user } = renderWithUserEvent(
      <div data-testid="scroller" style={{ overflowY: 'auto' }}>
        <AddFromAddressBook
          chainId={CHAIN_ID}
          safeAddress={safeAddress}
          contacts={[contact('Alice', ContactSource.space)]}
          existing={[]}
          onAdd={jest.fn()}
        />
      </div>,
    )
    const scroller = screen.getByTestId('scroller')

    await open(user)
    expect(scroller).toContainElement(screen.getByTestId('address-book-spacer'))

    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('address-book-spacer')).not.toBeInTheDocument()
  })
})
