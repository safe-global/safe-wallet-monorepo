import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddressBookToolbar, { type AddressBookToolbarProps } from '../AddressBookToolbar'
import { SIGNER_TAG } from '../tags/systemTags'
import { ADMIN_PERMISSIONS, EMPTY_FILTERS, MEMBER_PERMISSIONS } from '../types'

const renderToolbar = (props: Partial<AddressBookToolbarProps> = {}) =>
  render(
    <AddressBookToolbar
      permissions={ADMIN_PERMISSIONS}
      filters={EMPTY_FILTERS}
      onFiltersChange={jest.fn()}
      systemTags={[]}
      tags={[]}
      {...props}
    />,
  )

describe('AddressBookToolbar', () => {
  it('groups only Import and Export', () => {
    renderToolbar()

    const group = screen.getByTestId('export-address-book').closest<HTMLElement>('[data-slot="button-group"]')
    expect(group).not.toBeNull()
    const buttons = within(group as HTMLElement).getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(['Import', 'Export'])
  })

  it('hides Add contact and Import from members but keeps Export', () => {
    renderToolbar({ permissions: MEMBER_PERMISSIONS })

    expect(screen.queryByTestId('add-contact')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument()
    expect(screen.getByTestId('export-address-book')).toBeInTheDocument()
  })

  it('shows Add contact and Import to admins and fires their callbacks', async () => {
    const onAddContact = jest.fn()
    const onImport = jest.fn()
    renderToolbar({ onAddContact, onImport })

    await userEvent.click(screen.getByTestId('add-contact'))
    await userEvent.click(screen.getByRole('button', { name: 'Import' }))

    expect(onAddContact).toHaveBeenCalledTimes(1)
    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it('lists the automatic tags first in Filters, without rename or delete', async () => {
    renderToolbar({
      systemTags: [{ tag: SIGNER_TAG, count: 2 }],
      tags: [{ tag: 'Vendor', count: 3 }],
      tagEditing: { onRenameOption: jest.fn(), onDeleteOption: jest.fn() },
    })

    await userEvent.click(screen.getByTestId('filters-dropdown'))
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())

    const [first, second] = screen.getAllByRole('option')
    expect(first).toHaveTextContent(SIGNER_TAG)
    expect(second).toHaveTextContent('Vendor')
    expect(screen.queryByRole('button', { name: `Rename ${SIGNER_TAG}` })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `Delete ${SIGNER_TAG}` })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rename Vendor' })).toBeInTheDocument()
  })

  it('hides Clear while nothing is filtered', () => {
    renderToolbar()

    expect(screen.queryByTestId('clear-filters')).not.toBeInTheDocument()
  })

  it('resets the filters on Clear', async () => {
    const onFiltersChange = jest.fn()
    renderToolbar({ filters: { query: 'atlas', tags: ['Workspace Safe', 'Vendor'] }, onFiltersChange })

    await userEvent.click(screen.getByTestId('clear-filters'))

    expect(onFiltersChange).toHaveBeenCalledWith(EMPTY_FILTERS)
  })
})
