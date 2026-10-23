import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import AddressBookTable from '../AddressBookTable'
import { ADDRESSES, LOCAL_CONTACTS, WORKSPACE_CONTACTS } from '../mocks/fixtures'

const byAddress = (address: string) => {
  const contact = WORKSPACE_CONTACTS.find((item) => item.address === address)
  if (!contact) throw new Error(`No fixture for ${address}`)
  return contact
}

const treasury = byAddress(ADDRESSES.treasury)
const payroll = byAddress(ADDRESSES.payroll)
const atlas = byAddress(ADDRESSES.atlas)

const mockIsMobile = jest.fn(() => false)
jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: () => mockIsMobile() }))

const columnHeaders = () => screen.getAllByRole('columnheader').map((header) => header.textContent)

describe('AddressBookTable', () => {
  beforeEach(() => mockIsMobile.mockReturnValue(false))

  it('shows Contact, Chains and Added by for the workspace book', () => {
    render(<AddressBookTable contacts={[treasury]} />)

    expect(columnHeaders()).toEqual(['Contact', 'Chains', 'Added by', ''])
  })

  it('leaves Added by out of the local book', () => {
    render(<AddressBookTable contacts={LOCAL_CONTACTS} book="local" />)

    expect(columnHeaders()).toEqual(['Contact', 'Chains', ''])
  })

  it('shows the full address of every contact', () => {
    const contacts = [treasury, payroll, atlas]
    render(<AddressBookTable contacts={contacts} />)

    expect(screen.getAllByTestId('grouped-address').map((address) => address.textContent)).toEqual(
      contacts.map((contact) => checksumAddress(contact.address)),
    )
  })

  it('shows who added a contact, or a dash when nobody is known', () => {
    render(<AddressBookTable contacts={[treasury, atlas]} />)

    const [treasuryRow, atlasRow] = screen.getAllByTestId('table-row')
    expect(within(treasuryRow).getByText('Maya Chen')).toBeInTheDocument()
    expect(within(atlasRow).getByText('—')).toBeInTheDocument()
  })

  it('shortens the wallet address a contact was added by and shows it in full on hover', async () => {
    render(<AddressBookTable contacts={[{ ...treasury, addedBy: ADDRESSES.maya }]} />)

    await userEvent.hover(within(screen.getByTestId('table-row')).getByText(shortenAddress(ADDRESSES.maya)))

    expect(await screen.findByText(ADDRESSES.maya)).toBeInTheDocument()
  })

  it('marks every contact of the local book as local', () => {
    render(<AddressBookTable contacts={LOCAL_CONTACTS} book="local" />)

    expect(screen.getAllByLabelText('Local contact')).toHaveLength(LOCAL_CONTACTS.length)
  })

  it('pins the contact column, so the name stays in view while the table scrolls', () => {
    render(<AddressBookTable contacts={[treasury]} />)

    expect(screen.getByTestId('table-cell-contact')).toHaveAttribute('data-sticky')
  })

  it('links each address to the explorer it is given', () => {
    render(
      <AddressBookTable
        contacts={[treasury]}

        getExplorerLink={(address) => ({ href: `https://explorer.test/${address}`, title: 'View on explorer.test' })}
      />,
    )

    expect(screen.getByRole('link', { name: 'View on explorer.test' })).toHaveAttribute(
      'href',
      `https://explorer.test/${treasury.address}`,
    )
  })

  it('has no row menu without edit or delete', () => {
    render(<AddressBookTable contacts={[treasury, payroll]} />)

    expect(screen.queryAllByRole('button', { name: /^Actions for/ })).toHaveLength(0)
  })

  it('hands the row contact to the menu actions', async () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    render(
      <AddressBookTable
        contacts={[treasury, payroll]}

        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Payroll' }))
    await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit contact' }))

    expect(onEdit).toHaveBeenCalledWith(payroll)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('renders the row action of each contact', () => {
    render(
      <AddressBookTable
        contacts={LOCAL_CONTACTS}

        book="local"
        renderRowAction={(contact) => <button>Share {contact.name}</button>}
      />,
    )

    expect(screen.getAllByRole('button', { name: /^Share / }).map((button) => button.textContent)).toEqual(
      LOCAL_CONTACTS.map((contact) => `Share ${contact.name}`),
    )
  })

  it('folds Chains and Added by into the compact row detail of the workspace book', async () => {
    mockIsMobile.mockReturnValue(true)
    render(<AddressBookTable contacts={[treasury]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Show details' }))

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(['Chains', 'Added by'])
    const [chains, addedBy] = screen.getAllByRole('definition')
    expect(within(chains).getByTestId('chain-logos')).toBeInTheDocument()
    expect(addedBy).toHaveTextContent('Maya Chen')
  })

  it('folds only Chains into the compact row detail of the local book', async () => {
    mockIsMobile.mockReturnValue(true)
    render(<AddressBookTable contacts={LOCAL_CONTACTS.slice(0, 1)} book="local" />)

    await userEvent.click(screen.getByRole('button', { name: 'Show details' }))

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(['Chains'])
    expect(within(screen.getByRole('definition')).getByTestId('chain-logos')).toBeInTheDocument()
  })
})
