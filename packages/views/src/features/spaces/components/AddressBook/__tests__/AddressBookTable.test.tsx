import { faker } from '@faker-js/faker'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddressBookTable from '../AddressBookTable'
import { SIGNER_TAG, WORKSPACE_SAFE_TAG } from '../tags/systemTags'
import { ADMIN_PERMISSIONS, type AddressBookContact } from '../types'

const buildContact = (fields: Partial<AddressBookContact> = {}): AddressBookContact => ({
  address: faker.finance.ethereumAddress(),
  name: faker.company.name(),
  chains: [{ chainId: '1', name: 'Ethereum' }],
  signerOf: [],
  tags: [],
  ...fields,
})

const renderTable = (contact: AddressBookContact) =>
  render(<AddressBookTable contacts={[contact]} permissions={ADMIN_PERMISSIONS} />)

describe('AddressBookTable', () => {
  it('shows the automatic labels in the Type column, not in Contact or Tags', () => {
    renderTable(buildContact({ isWorkspaceSafe: true, signerOf: ['Treasury'], tags: ['Vendor'] }))

    const typeCell = screen.getByTestId('table-cell-type')
    const labels = within(typeCell).getByTestId('automatic-labels')
    expect(
      within(labels)
        .getAllByTestId('system-tag-chip')
        .map((chip) => chip.textContent),
    ).toEqual([WORKSPACE_SAFE_TAG, SIGNER_TAG])

    expect(within(screen.getByTestId('table-cell-contact')).queryByTestId('automatic-labels')).not.toBeInTheDocument()

    const tagsCell = screen.getByTestId('table-cell-tags')
    expect(within(tagsCell).queryByTestId('system-tag-chip')).not.toBeInTheDocument()
    expect(
      within(tagsCell)
        .getAllByTestId('tag-chip')
        .map((chip) => chip.textContent),
    ).toEqual(['Vendor'])
  })

  it('shows a dash in Tags for a workspace Safe without team tags', () => {
    renderTable(buildContact({ isWorkspaceSafe: true }))

    expect(within(screen.getByTestId('table-cell-type')).getByTestId('automatic-labels')).toBeInTheDocument()
    expect(screen.getByTestId('table-cell-tags')).toHaveTextContent('—')
  })

  it('shows a dash in Type for a plain contact', () => {
    renderTable(buildContact({ tags: ['Vendor'] }))

    expect(screen.queryByTestId('automatic-labels')).not.toBeInTheDocument()
    expect(screen.getByTestId('table-cell-type')).toHaveTextContent('—')
  })

  it('shows the Type column in the local book too', () => {
    render(
      <AddressBookTable
        contacts={[buildContact({ signerOf: ['Treasury'], isLocal: true })]}
        permissions={ADMIN_PERMISSIONS}
        book="local"
      />,
    )

    expect(within(screen.getByTestId('table-cell-type')).getByTestId('system-tag-chip')).toHaveTextContent(SIGNER_TAG)
  })

  it('sorts workspace Safes first, then signers, then the rest when Type is clicked', async () => {
    const contacts = [
      buildContact({ name: 'Atlas Vendor', tags: ['Vendor'] }),
      buildContact({ name: 'Bravo Signer', signerOf: ['Treasury'] }),
      buildContact({ name: 'Cedar Treasury', isWorkspaceSafe: true }),
    ]
    render(<AddressBookTable contacts={contacts} permissions={ADMIN_PERMISSIONS} />)

    await userEvent.click(screen.getByRole('button', { name: /^Type/ }))

    expect(screen.getAllByTestId('table-cell-contact').map((cell) => cell.textContent)).toEqual([
      expect.stringContaining('Cedar Treasury'),
      expect.stringContaining('Bravo Signer'),
      expect.stringContaining('Atlas Vendor'),
    ])
  })
})
