import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddressBookToolbar, { type AddressBookToolbarProps } from '../AddressBookToolbar'
import { SIGNER_TAG, WORKSPACE_SAFE_TAG } from '../tags/systemTags'
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

  const openFilters = async () => {
    await userEvent.click(screen.getByTestId('filters-dropdown'))
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())
  }

  it('lists the automatic labels in a Type section without rename or delete', async () => {
    renderToolbar({
      systemTags: [
        { tag: WORKSPACE_SAFE_TAG, count: 1 },
        { tag: SIGNER_TAG, count: 2 },
      ],
      tags: [{ tag: 'Vendor', count: 3 }],
      tagEditing: { onRenameOption: jest.fn(), onDeleteOption: jest.fn() },
    })

    await openFilters()

    const type = screen.getByRole('listbox', { name: 'Type' })
    expect(
      within(type)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([expect.stringContaining(WORKSPACE_SAFE_TAG), expect.stringContaining(SIGNER_TAG)])
    expect(within(type).queryByRole('button', { name: /^Rename/ })).not.toBeInTheDocument()
    expect(within(type).queryByRole('button', { name: /^Delete/ })).not.toBeInTheDocument()

    const tags = screen.getByRole('listbox', { name: 'Tags' })
    expect(within(tags).getAllByRole('option')).toHaveLength(1)
    expect(within(tags).getByRole('option')).toHaveTextContent('Vendor')
    expect(within(tags).getByRole('button', { name: 'Rename Vendor' })).toBeInTheDocument()
    expect(within(tags).getByRole('button', { name: 'Delete Vendor' })).toBeInTheDocument()
  })

  it('hides the Type section when no contact has an automatic label', async () => {
    renderToolbar({ tags: [{ tag: 'Vendor', count: 3 }] })

    await openFilters()

    expect(screen.queryByRole('listbox', { name: 'Type' })).not.toBeInTheDocument()
    expect(screen.queryByText('Type')).not.toBeInTheDocument()
  })

  it('keeps the selected team tags when a Type option is ticked', async () => {
    const onFiltersChange = jest.fn()
    renderToolbar({
      filters: { query: 'atlas', tags: ['Vendor'] },
      onFiltersChange,
      systemTags: [{ tag: SIGNER_TAG, count: 2 }],
      tags: [
        { tag: 'Vendor', count: 3 },
        { tag: 'EU', count: 1 },
      ],
    })

    await openFilters()
    await userEvent.click(
      within(screen.getByRole('listbox', { name: 'Type' })).getByRole('option', { name: new RegExp(SIGNER_TAG) }),
    )

    expect(onFiltersChange).toHaveBeenCalledWith({ query: 'atlas', tags: [SIGNER_TAG, 'Vendor'] })
  })

  it('keeps the selected Type labels when a team tag is ticked', async () => {
    const onFiltersChange = jest.fn()
    renderToolbar({
      filters: { query: '', tags: [SIGNER_TAG] },
      onFiltersChange,
      systemTags: [{ tag: SIGNER_TAG, count: 2 }],
      tags: [{ tag: 'Vendor', count: 3 }],
    })

    await openFilters()
    await userEvent.click(within(screen.getByRole('listbox', { name: 'Tags' })).getByRole('option', { name: /Vendor/ }))

    expect(onFiltersChange).toHaveBeenCalledWith({ query: '', tags: [SIGNER_TAG, 'Vendor'] })
  })

  it('hides Clear while nothing is filtered', () => {
    renderToolbar()

    expect(screen.queryByTestId('clear-filters')).not.toBeInTheDocument()
  })

  it('resets the filters on Clear', async () => {
    const onFiltersChange = jest.fn()
    renderToolbar({ filters: { query: 'atlas', tags: [WORKSPACE_SAFE_TAG, 'Vendor'] }, onFiltersChange })

    await userEvent.click(screen.getByTestId('clear-filters'))

    expect(onFiltersChange).toHaveBeenCalledWith(EMPTY_FILTERS)
  })
})
