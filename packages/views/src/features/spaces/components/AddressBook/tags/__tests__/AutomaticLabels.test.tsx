import { faker } from '@faker-js/faker'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AutomaticLabels from '../AutomaticLabels'
import { SIGNER_TAG, WORKSPACE_SAFE_TAG, systemTagTitles } from '../systemTags'
import type { AddressBookContact } from '../../types'

const buildContact = (fields: Partial<AddressBookContact> = {}): AddressBookContact => ({
  address: faker.finance.ethereumAddress(),
  name: faker.company.name(),
  chains: [{ chainId: '1', name: 'Ethereum' }],
  signerOf: [],
  tags: [],
  ...fields,
})

describe('AutomaticLabels', () => {
  it('renders nothing for a plain contact, even one with team tags', () => {
    const { container } = render(<AutomaticLabels contact={buildContact({ tags: ['Vendor'] })} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('labels a workspace Safe', () => {
    render(<AutomaticLabels contact={buildContact({ isWorkspaceSafe: true })} />)

    const labels = screen.getByTestId('automatic-labels')
    expect(
      within(labels)
        .getAllByTestId('system-tag-chip')
        .map((chip) => chip.textContent),
    ).toEqual([WORKSPACE_SAFE_TAG])
  })

  it('shows both labels, Workspace Safe first, for a workspace Safe that also signs', () => {
    render(<AutomaticLabels contact={buildContact({ isWorkspaceSafe: true, signerOf: ['Treasury'] })} />)

    expect(screen.getAllByTestId('system-tag-chip').map((chip) => chip.textContent)).toEqual([
      WORKSPACE_SAFE_TAG,
      SIGNER_TAG,
    ])
  })

  it('explains on hover which Safes a signer signs for', async () => {
    const contact = buildContact({ signerOf: ['Treasury', 'Payroll'] })
    render(<AutomaticLabels contact={contact} />)

    await userEvent.hover(screen.getByTestId('system-tag-chip'))

    const title = systemTagTitles(contact)[SIGNER_TAG]
    expect(title).toContain('Treasury, Payroll')
    expect(await screen.findByText(title)).toBeInTheDocument()
  })
})
