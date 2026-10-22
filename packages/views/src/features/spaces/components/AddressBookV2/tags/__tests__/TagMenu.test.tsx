import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@safe-global/views/components/ui/button'
import { buildSpaceAddressBookTags, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import TagMenu, { existingTagIds, type TagActions, type TagMenuProps } from '../TagMenu'

const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor', contactCount: 4 }).build()
const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal', contactCount: 0 }).build()
const tags = [vendor, internal]

const buildActions = (overrides: Partial<TagActions> = {}): TagActions => ({
  onCreate: jest.fn().mockResolvedValue({}),
  onRename: jest.fn().mockResolvedValue({}),
  onDelete: jest.fn().mockResolvedValue(undefined),
  ...overrides,
})

const renderMenu = (props: Partial<TagMenuProps> = {}) => {
  const onSelect = jest.fn().mockReturnValue(undefined)
  const onMerged = jest.fn()
  render(
    <TagMenu
      trigger={<Button />}
      triggerContent="Tags"
      tags={tags}
      selected={[]}
      onSelect={onSelect}
      onMerged={onMerged}
      clearLabel="Clear"
      {...props}
    />,
  )
  return { onSelect, onMerged }
}

const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Tags' }))
  await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())
}

const typeAndCreate = async (text: string) => {
  await userEvent.type(screen.getByRole('searchbox'), text)
  await userEvent.click(screen.getByRole('option', { name: /Create/ }))
}

const rename = async (from: string, to: string) => {
  await userEvent.click(screen.getByRole('button', { name: `Rename ${from}` }))
  await userEvent.clear(screen.getByTestId('facet-option-rename-input'))
  await userEvent.type(screen.getByTestId('facet-option-rename-input'), `${to}{Enter}`)
}

describe('existingTagIds', () => {
  it('keeps only the ids the workspace still has, in order', () => {
    expect(existingTagIds([2, 99, 1], tags)).toEqual([2, 1])
  })
})

describe('TagMenu', () => {
  it('lists every tag with how many contacts have it', async () => {
    renderMenu()

    await open()

    expect(screen.getByRole('option', { name: /Vendor\s*4/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Internal\s*0/ })).toBeInTheDocument()
  })

  it('ticks a tag by id', async () => {
    const { onSelect } = renderMenu({ selected: [2] })

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))

    expect(onSelect).toHaveBeenCalledWith([2, 1])
  })

  it('shows the error a refused selection resolves to', async () => {
    renderMenu({ onSelect: jest.fn().mockReturnValue('A contact can have at most 3 tags') })

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))

    expect(screen.getByTestId('tag-menu-error')).toHaveTextContent('A contact can have at most 3 tags')
  })

  it('clears the selection with the given label', async () => {
    const { onSelect } = renderMenu({ selected: [1], clearLabel: 'Clear filters' })

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onSelect).toHaveBeenCalledWith([])
  })

  it('offers no create, rename or delete without actions', async () => {
    renderMenu()

    await open()
    expect(screen.queryByRole('button', { name: 'Rename Vendor' })).not.toBeInTheDocument()
    await userEvent.type(screen.getByRole('searchbox'), 'EU')

    expect(screen.queryByRole('option', { name: /Create/ })).not.toBeInTheDocument()
  })

  describe('create', () => {
    it('creates the tag with the normalized name and hands it on', async () => {
      const created = spaceAddressBookTagBuilder().with({ id: 3, name: 'Key vendors' }).build()
      const actions = buildActions({ onCreate: jest.fn().mockResolvedValue({ tag: created }) })
      const onCreated = jest.fn()
      renderMenu({ actions, onCreated })

      await open()
      await typeAndCreate('Key   vendors')

      expect(actions.onCreate).toHaveBeenCalledWith('Key vendors')
      expect(onCreated).toHaveBeenCalledWith(created)
    })

    it('shows the error the create was refused with', async () => {
      const actions = buildActions({
        onCreate: jest.fn().mockResolvedValue({ error: 'A tag with this name already exists.' }),
      })
      renderMenu({ actions })

      await open()
      await typeAndCreate('EU')

      expect(await screen.findByTestId('tag-menu-error')).toHaveTextContent('A tag with this name already exists.')
    })

    it('explains an invalid name without a request', async () => {
      const actions = buildActions()
      renderMenu({ actions })

      await open()
      await typeAndCreate('Signer')

      expect(screen.getByTestId('tag-menu-error')).toHaveTextContent(
        "'Signer' is added automatically and can't be used as a tag name",
      )
      expect(actions.onCreate).not.toHaveBeenCalled()
    })

    it('refuses a ninth workspace tag and reports the limit', async () => {
      const actions = buildActions()
      const onLimitReached = jest.fn()
      renderMenu({ tags: buildSpaceAddressBookTags(8), actions, onLimitReached })

      await open()
      await typeAndCreate('One too many')

      expect(screen.getByTestId('tag-menu-error')).toHaveTextContent('Your workspace has 8 tags.')
      expect(actions.onCreate).not.toHaveBeenCalled()
      expect(onLimitReached).toHaveBeenCalledTimes(1)
    })

    it('shows what beforeCreate refuses with and creates nothing', async () => {
      const actions = buildActions()
      renderMenu({ actions, beforeCreate: () => 'A contact can have at most 3 tags' })

      await open()
      await typeAndCreate('Fourth')

      expect(screen.getByTestId('tag-menu-error')).toHaveTextContent('A contact can have at most 3 tags')
      expect(actions.onCreate).not.toHaveBeenCalled()
    })
  })

  describe('rename and delete', () => {
    it('renames a tag and leaves the selection alone', async () => {
      const actions = buildActions()
      const { onMerged } = renderMenu({ selected: [1], actions })

      await open()
      await rename('Vendor', 'Supplier')

      expect(actions.onRename).toHaveBeenCalledWith(vendor, 'Supplier')
      expect(onMerged).not.toHaveBeenCalled()
    })

    it('moves a ticked tag onto the tag a rename merged it into', async () => {
      const actions = buildActions({ onRename: jest.fn().mockResolvedValue({ mergedIntoId: 2 }) })
      const { onMerged } = renderMenu({ selected: [1, 2], actions })

      await open()
      await rename('Vendor', 'Internal')

      expect(onMerged).toHaveBeenCalledWith([2])
    })

    it('leaves the selection alone when an unticked tag is merged', async () => {
      const actions = buildActions({ onRename: jest.fn().mockResolvedValue({ mergedIntoId: 2 }) })
      const { onMerged } = renderMenu({ selected: [2], actions })

      await open()
      await rename('Vendor', 'Internal')

      expect(onMerged).not.toHaveBeenCalled()
    })

    it('keeps the editor open with the error a rename was refused with', async () => {
      const actions = buildActions({ onRename: jest.fn().mockResolvedValue({ error: 'Too many requests' }) })
      renderMenu({ actions })

      await open()
      await rename('Vendor', 'Supplier')

      expect(screen.getByText('Too many requests')).toBeInTheDocument()
    })

    it('confirms a delete with the number of contacts that have the tag', async () => {
      const actions = buildActions()
      renderMenu({ actions })

      await open()
      await userEvent.click(screen.getByRole('button', { name: 'Delete Vendor' }))
      expect(screen.getByText('Delete ‘Vendor’ from 4 contacts?')).toBeInTheDocument()
      await userEvent.click(screen.getByTestId('facet-option-confirm-delete'))

      expect(actions.onDelete).toHaveBeenCalledWith(vendor)
    })
  })
})
