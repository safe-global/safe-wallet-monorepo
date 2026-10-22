import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildSpaceAddressBookTags, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import TagSelect, { type TagActions, type TagSelectProps } from '../TagSelect'

const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor', contactCount: 4 }).build()
const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal', contactCount: 0 }).build()
const tags = [vendor, internal]

const buildActions = (overrides: Partial<TagActions> = {}): TagActions => ({
  onCreate: jest.fn().mockResolvedValue({}),
  onRename: jest.fn().mockResolvedValue({}),
  onDelete: jest.fn().mockResolvedValue(undefined),
  ...overrides,
})

const renderSelect = (props: Partial<TagSelectProps> = {}) => {
  const onChange = jest.fn()
  const result = render(<TagSelect mode="assign" tags={tags} value={[]} onChange={onChange} {...props} />)
  return { ...result, onChange }
}

const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Tags|Filters/ }))
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

describe('TagSelect', () => {
  describe('both modes', () => {
    it.each(['filter', 'assign'] as const)('%s: lists every tag with how many contacts have it', async (mode) => {
      renderSelect({ mode })

      await open()

      expect(screen.getByRole('option', { name: /Vendor\s*4/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Internal\s*0/ })).toBeInTheDocument()
    })

    it.each(['filter', 'assign'] as const)('%s: ticks a tag by id', async (mode) => {
      const { onChange } = renderSelect({ mode, value: [2] })

      await open()
      await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))

      expect(onChange).toHaveBeenCalledWith([2, 1])
    })

    it.each(['filter', 'assign'] as const)('%s: offers create, rename and delete with actions', async (mode) => {
      renderSelect({ mode, actions: buildActions() })

      await open()
      expect(screen.getByRole('button', { name: 'Rename Vendor' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete Vendor' })).toBeInTheDocument()
      await userEvent.type(screen.getByRole('searchbox'), 'EU')

      expect(screen.getByRole('option', { name: /Create/ })).toBeInTheDocument()
    })

    it('offers no create, rename or delete without actions', async () => {
      renderSelect()

      await open()
      expect(screen.queryByRole('button', { name: 'Rename Vendor' })).not.toBeInTheDocument()
      await userEvent.type(screen.getByRole('searchbox'), 'EU')

      expect(screen.queryByRole('option', { name: /Create/ })).not.toBeInTheDocument()
    })

    it('leaves a tag the workspace no longer has out of the selection', () => {
      renderSelect({ value: [1, 99] })

      expect(screen.getByTestId('tag-select-count')).toHaveTextContent('1')
    })
  })

  describe('create', () => {
    it('assign: creates the tag at once and ticks it', async () => {
      const created = spaceAddressBookTagBuilder().with({ id: 3, name: 'Key vendors' }).build()
      const actions = buildActions({ onCreate: jest.fn().mockResolvedValue({ tag: created }) })
      const { onChange } = renderSelect({ value: [1], actions })

      await open()
      await typeAndCreate('Key   vendors')

      expect(actions.onCreate).toHaveBeenCalledWith('Key vendors')
      expect(onChange).toHaveBeenCalledWith([1, 3])
    })

    it('filter: creates the tag at once and leaves the filters alone', async () => {
      const created = spaceAddressBookTagBuilder().with({ id: 3 }).build()
      const actions = buildActions({ onCreate: jest.fn().mockResolvedValue({ tag: created }) })
      const { onChange } = renderSelect({ mode: 'filter', actions })

      await open()
      await typeAndCreate('EU')

      expect(actions.onCreate).toHaveBeenCalledWith('EU')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('shows the error the create was refused with', async () => {
      const actions = buildActions({
        onCreate: jest.fn().mockResolvedValue({ error: 'A tag with this name already exists.' }),
      })
      renderSelect({ actions })

      await open()
      await typeAndCreate('EU')

      expect(await screen.findByTestId('tag-select-error')).toHaveTextContent('A tag with this name already exists.')
    })

    it('explains an invalid name without a request', async () => {
      const actions = buildActions()
      renderSelect({ actions })

      await open()
      await typeAndCreate('Signer')

      expect(screen.getByTestId('tag-select-error')).toHaveTextContent(
        "'Signer' is added automatically and can't be used as a tag name",
      )
      expect(actions.onCreate).not.toHaveBeenCalled()
    })

    it('refuses a ninth workspace tag and reports the limit', async () => {
      const actions = buildActions()
      const onLimitReached = jest.fn()
      renderSelect({ tags: buildSpaceAddressBookTags(8), actions, onLimitReached })

      await open()
      await typeAndCreate('One too many')

      expect(screen.getByTestId('tag-select-error')).toHaveTextContent('Your workspace has 8 tags.')
      expect(actions.onCreate).not.toHaveBeenCalled()
      expect(onLimitReached).toHaveBeenCalledTimes(1)
    })

    it('assign: creates nothing for a contact that already has 3 tags', async () => {
      const actions = buildActions()
      const all = buildSpaceAddressBookTags(3)
      renderSelect({ tags: all, value: all.map((tag) => tag.id), actions })

      await open()
      await typeAndCreate('Fourth')

      expect(screen.getByTestId('tag-select-error')).toHaveTextContent('A contact can have at most 3 tags')
      expect(actions.onCreate).not.toHaveBeenCalled()
    })
  })

  describe('assign limit', () => {
    it('refuses a fourth tag on the contact', async () => {
      const all = buildSpaceAddressBookTags(4)
      const { onChange } = renderSelect({ tags: all, value: all.slice(0, 3).map((tag) => tag.id) })

      await open()
      await userEvent.click(screen.getByRole('option', { name: new RegExp(all[3].name) }))

      expect(screen.getByTestId('tag-select-error')).toHaveTextContent('A contact can have at most 3 tags')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('filter: lets any number of tags be ticked', async () => {
      const all = buildSpaceAddressBookTags(4)
      const { onChange } = renderSelect({ mode: 'filter', tags: all, value: all.slice(0, 3).map((tag) => tag.id) })

      await open()
      await userEvent.click(screen.getByRole('option', { name: new RegExp(all[3].name) }))

      expect(onChange).toHaveBeenCalledWith(all.map((tag) => tag.id))
    })
  })

  describe('rename and delete', () => {
    it('renames a tag and keeps the selection', async () => {
      const actions = buildActions()
      const { onChange } = renderSelect({ value: [1], actions })

      await open()
      await rename('Vendor', 'Supplier')

      expect(actions.onRename).toHaveBeenCalledWith(vendor, 'Supplier')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('moves a selected tag onto the tag a rename merged it into', async () => {
      const actions = buildActions({ onRename: jest.fn().mockResolvedValue({ mergedIntoId: 2 }) })
      const { onChange } = renderSelect({ value: [1, 2], actions })

      await open()
      await rename('Vendor', 'Internal')

      expect(onChange).toHaveBeenCalledWith([2])
    })

    it('keeps the editor open with the error a rename was refused with', async () => {
      const actions = buildActions({ onRename: jest.fn().mockResolvedValue({ error: 'Too many requests' }) })
      renderSelect({ actions })

      await open()
      await rename('Vendor', 'Supplier')

      expect(screen.getByText('Too many requests')).toBeInTheDocument()
    })

    it('confirms a delete with the number of contacts that have the tag', async () => {
      const actions = buildActions()
      renderSelect({ actions })

      await open()
      await userEvent.click(screen.getByRole('button', { name: 'Delete Vendor' }))
      expect(screen.getByText('Delete ‘Vendor’ from 4 contacts?')).toBeInTheDocument()
      await userEvent.click(screen.getByTestId('facet-option-confirm-delete'))

      expect(actions.onDelete).toHaveBeenCalledWith(vendor)
    })
  })

  describe('filter mode', () => {
    it('shows how many filters are on, and clears them', async () => {
      const { onChange } = renderSelect({ mode: 'filter', value: [1, 2] })
      expect(screen.getByTestId('tag-select-count')).toHaveTextContent('2')

      await open()
      await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(onChange).toHaveBeenCalledWith([])
    })

    it('reports the selection once it closes after the user changed it', async () => {
      const onSelectionCommitted = jest.fn()
      const Controlled = () => {
        const [value, setValue] = useState<number[]>([])
        return (
          <TagSelect
            mode="filter"
            tags={tags}
            value={value}
            onChange={setValue}
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
      const { rerender, onChange } = renderSelect({ mode: 'filter', value: [1], onSelectionCommitted })

      await open()
      rerender(
        <TagSelect
          mode="filter"
          tags={[internal]}
          value={[2]}
          onChange={onChange}
          onSelectionCommitted={onSelectionCommitted}
        />,
      )
      await userEvent.keyboard('{Escape}')

      expect(onSelectionCommitted).not.toHaveBeenCalled()
    })
  })

  describe('assign mode', () => {
    it('shows the ticked tags beside the button', () => {
      renderSelect({ value: [2, 1] })

      expect(screen.getAllByTestId('tag-chip').map((chip) => chip.textContent)).toEqual(['Internal', 'Vendor'])
    })
  })
})
