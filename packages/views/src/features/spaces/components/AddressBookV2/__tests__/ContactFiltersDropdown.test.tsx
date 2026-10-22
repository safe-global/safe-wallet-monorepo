import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { spaceAddressBookTagBuilder } from '@/tests/builders/space'
import ContactFiltersDropdown, { type ContactFiltersDropdownProps } from '../ContactFiltersDropdown'

const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor', contactCount: 4 }).build()
const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal', contactCount: 0 }).build()

const renderDropdown = (props: Partial<ContactFiltersDropdownProps> = {}) => {
  const onSelectedTagIdsChange = jest.fn()
  const result = render(
    <ContactFiltersDropdown
      tags={[vendor, internal]}
      selectedTagIds={[]}
      onSelectedTagIdsChange={onSelectedTagIdsChange}
      {...props}
    />,
  )
  return { ...result, onSelectedTagIdsChange }
}

const open = async () => {
  await userEvent.click(screen.getByTestId('filters-dropdown'))
  await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())
}

describe('ContactFiltersDropdown', () => {
  it('lists every workspace tag with how many contacts have it, unused ones included', async () => {
    renderDropdown()

    await open()

    expect(screen.getByRole('option', { name: /Vendor\s*4/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Internal\s*0/ })).toBeInTheDocument()
  })

  it('selects tags by id', async () => {
    const { onSelectedTagIdsChange } = renderDropdown({ selectedTagIds: [2] })

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))

    expect(onSelectedTagIdsChange).toHaveBeenCalledWith([2, 1])
  })

  it('shows how many filters are on, and clears them', async () => {
    const { onSelectedTagIdsChange } = renderDropdown({ selectedTagIds: [1, 2] })
    expect(screen.getByTestId('filters-count')).toHaveTextContent('2')

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onSelectedTagIdsChange).toHaveBeenCalledWith([])
  })

  it('reports the selection once it closes after the user changed it', async () => {
    const onSelectionCommitted = jest.fn()
    const Controlled = () => {
      const [selected, setSelected] = useState<number[]>([])
      return (
        <ContactFiltersDropdown
          tags={[vendor, internal]}
          selectedTagIds={selected}
          onSelectedTagIdsChange={setSelected}
          onSelectionCommitted={onSelectionCommitted}
        />
      )
    }
    render(<Controlled />)

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))
    await userEvent.keyboard('{Escape}')

    expect(onSelectionCommitted).toHaveBeenCalledTimes(1)
    expect(onSelectionCommitted).toHaveBeenCalledWith([1])
  })

  it('reports nothing when a rename or delete changed the selection', async () => {
    const onSelectionCommitted = jest.fn()
    const { rerender, onSelectedTagIdsChange } = renderDropdown({ selectedTagIds: [1], onSelectionCommitted })

    await open()
    rerender(
      <ContactFiltersDropdown
        tags={[internal]}
        selectedTagIds={[2]}
        onSelectedTagIdsChange={onSelectedTagIdsChange}
        onSelectionCommitted={onSelectionCommitted}
      />,
    )
    await userEvent.keyboard('{Escape}')

    expect(onSelectionCommitted).not.toHaveBeenCalled()
  })

  it('reports nothing when it closes with the same selection', async () => {
    const onSelectionCommitted = jest.fn()
    renderDropdown({ selectedTagIds: [1], onSelectionCommitted })

    await open()
    await userEvent.keyboard('{Escape}')

    expect(onSelectionCommitted).not.toHaveBeenCalled()
  })

  it('confirms a delete with the number of contacts that have the tag', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined)
    renderDropdown({ tagEditing: { onRename: jest.fn(), onDelete } })

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Delete Vendor' }))

    expect(screen.getByText('Delete ‘Vendor’ from 4 contacts?')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('facet-option-confirm-delete'))

    expect(onDelete).toHaveBeenCalledWith(vendor)
  })

  it('renames a tag inline', async () => {
    const onRename = jest.fn().mockResolvedValue(undefined)
    renderDropdown({ tagEditing: { onRename, onDelete: jest.fn() } })

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Rename Vendor' }))
    await userEvent.clear(screen.getByTestId('facet-option-rename-input'))
    await userEvent.type(screen.getByTestId('facet-option-rename-input'), 'Supplier{Enter}')

    expect(onRename).toHaveBeenCalledWith(vendor, 'Supplier')
  })

  it('offers no rename or delete without tag editing', async () => {
    renderDropdown()

    await open()

    expect(screen.queryByRole('button', { name: 'Rename Vendor' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete Vendor' })).not.toBeInTheDocument()
  })
})
