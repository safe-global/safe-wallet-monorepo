import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/react'
import EditTagsDialog from '../EditTagsDialog'
import { SIGNER_TAG, WORKSPACE_SAFE_TAG } from '../../tags/systemTags'
import type { AddressBookContact } from '../../types'

const buildContact = (fields: Partial<AddressBookContact> = {}): AddressBookContact => ({
  address: faker.finance.ethereumAddress(),
  name: faker.person.fullName(),
  chains: [{ chainId: '1', name: 'Ethereum' }],
  signerOf: [],
  tags: ['Vendor'],
  ...fields,
})

const renderDialog = (contact: AddressBookContact) =>
  render(<EditTagsDialog contact={contact} tagOptions={[]} onSave={jest.fn()} onClose={jest.fn()} />)

describe('EditTagsDialog', () => {
  it('shows the contact name and its team tags', () => {
    const contact = buildContact({ tags: ['Vendor', 'EU'] })
    renderDialog(contact)

    expect(screen.getByText(contact.name)).toBeInTheDocument()
    expect(screen.getAllByTestId('tag-chip').map((chip) => chip.textContent)).toEqual(['Vendor', 'EU'])
  })

  it('leaves out the automatic labels of a workspace Safe that is also a signer', () => {
    renderDialog(buildContact({ isWorkspaceSafe: true, signerOf: ['Treasury'] }))

    expect(screen.queryByTestId('system-tag-chip')).not.toBeInTheDocument()
    expect(screen.queryByText(WORKSPACE_SAFE_TAG)).not.toBeInTheDocument()
    expect(screen.queryByText(SIGNER_TAG)).not.toBeInTheDocument()
  })
})
