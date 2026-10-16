import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import AddressBookTable from '../AddressBookTable'
import { ADDRESSES, LOCAL_CONTACTS, WORKSPACE_CONTACTS } from '../mocks/fixtures'
import { FULL_PERMISSIONS, NO_PERMISSIONS } from '../types'

const byAddress = (address: string) => {
  const contact = WORKSPACE_CONTACTS.find((item) => item.address === address)
  if (!contact) throw new Error(`No fixture for ${address}`)
  return contact
}

const treasury = byAddress(ADDRESSES.treasury)
const payroll = byAddress(ADDRESSES.payroll)
const atlas = byAddress(ADDRESSES.atlas)

const columnHeaders = () => screen.getAllByRole('columnheader').map((header) => header.textContent)

describe('AddressBookTable', () => {
  it('shows Contact, Chains and Added by for the workspace book', () => {
    render(<AddressBookTable contacts={[treasury]} permissions={FULL_PERMISSIONS} />)

    expect(columnHeaders()).toEqual(['Contact', 'Chains', 'Added by', ''])
  })

  it('leaves Added by out of the local book', () => {
    render(<AddressBookTable contacts={LOCAL_CONTACTS} permissions={FULL_PERMISSIONS} book="local" />)

    expect(columnHeaders()).toEqual(['Contact', 'Chains', ''])
  })

  it('shows the full address of every contact', () => {
    const contacts = [treasury, payroll, atlas]
    render(<AddressBookTable contacts={contacts} permissions={FULL_PERMISSIONS} />)

    expect(screen.getAllByTestId('grouped-address').map((address) => address.textContent)).toEqual(
      contacts.map((contact) => checksumAddress(contact.address)),
    )
  })

  it('shows who added a contact, or a dash when nobody is known', () => {
    render(<AddressBookTable contacts={[treasury, atlas]} permissions={FULL_PERMISSIONS} />)

    const [treasuryRow, atlasRow] = screen.getAllByTestId('table-row')
    expect(within(treasuryRow).getByText('Maya Chen')).toBeInTheDocument()
    expect(within(atlasRow).getByText('—')).toBeInTheDocument()
  })

  it('has no row menu for a member who may not change contacts', () => {
    render(<AddressBookTable contacts={[treasury, payroll]} permissions={NO_PERMISSIONS} />)

    expect(screen.queryAllByRole('button', { name: /^Actions for/ })).toHaveLength(0)
  })

  it('hands the row contact to the menu actions', async () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    render(
      <AddressBookTable
        contacts={[treasury, payroll]}
        permissions={FULL_PERMISSIONS}
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
        permissions={FULL_PERMISSIONS}
        book="local"
        renderRowAction={(contact) => <button>Share {contact.name}</button>}
      />,
    )

    expect(screen.getAllByRole('button', { name: /^Share / }).map((button) => button.textContent)).toEqual(
      LOCAL_CONTACTS.map((contact) => `Share ${contact.name}`),
    )
  })
})
