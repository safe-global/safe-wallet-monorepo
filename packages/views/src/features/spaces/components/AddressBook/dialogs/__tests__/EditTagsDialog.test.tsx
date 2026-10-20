import { faker } from '@faker-js/faker'
import { render, screen, within } from '@testing-library/react'
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
  it('shows the automatic tags of a signer above the picker', () => {
    renderDialog(buildContact({ signerOf: ['Treasury'] }))

    const automatic = screen.getByTestId('automatic-tags')
    expect(within(automatic).getByTestId('system-tag-chip')).toHaveTextContent(SIGNER_TAG)
    expect(within(automatic).queryByText(WORKSPACE_SAFE_TAG)).not.toBeInTheDocument()
  })

  it('shows no automatic tags for a plain contact', () => {
    renderDialog(buildContact())

    expect(screen.queryByTestId('automatic-tags')).not.toBeInTheDocument()
    expect(screen.queryByTestId('system-tag-chip')).not.toBeInTheDocument()
  })
})
