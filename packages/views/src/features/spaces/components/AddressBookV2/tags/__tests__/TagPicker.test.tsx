import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildSpaceAddressBookTags, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import type { TagActions } from '../TagMenu'
import TagPicker, { type TagPickerProps } from '../TagPicker'

const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor' }).build()
const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal' }).build()

const renderPicker = (props: Partial<TagPickerProps> = {}) => {
  const onChange = jest.fn()
  render(<TagPicker tags={[vendor, internal]} value={[]} onChange={onChange} {...props} />)
  return { onChange }
}

const open = async () => {
  await userEvent.click(screen.getByTestId('tag-picker'))
  await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())
}

describe('TagPicker', () => {
  it('shows the ticked tags beside the button, leaving out one the workspace no longer has', () => {
    renderPicker({ value: [2, 99, 1] })

    expect(screen.getAllByTestId('tag-chip').map((chip) => chip.textContent)).toEqual(['Internal', 'Vendor'])
    expect(screen.getByTestId('tag-menu-count')).toHaveTextContent('2')
  })

  it('ticks a tag', async () => {
    const { onChange } = renderPicker({ value: [2] })

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))

    expect(onChange).toHaveBeenCalledWith([2, 1])
  })

  it('refuses a fourth tag on the contact', async () => {
    const all = buildSpaceAddressBookTags(4)
    const { onChange } = renderPicker({ tags: all, value: all.slice(0, 3).map((tag) => tag.id) })

    await open()
    await userEvent.click(screen.getByRole('option', { name: new RegExp(all[3].name) }))

    expect(screen.getByTestId('tag-menu-error')).toHaveTextContent('A contact can have at most 3 tags')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('creates a tag at once and ticks it', async () => {
    const created = spaceAddressBookTagBuilder().with({ id: 3, name: 'EU' }).build()
    const actions: TagActions = {
      onCreate: jest.fn().mockResolvedValue({ tag: created }),
      onRename: jest.fn(),
      onDelete: jest.fn(),
    }
    const { onChange } = renderPicker({ value: [1], actions })

    await open()
    await userEvent.type(screen.getByRole('searchbox'), 'EU')
    await userEvent.click(screen.getByRole('option', { name: /Create/ }))

    expect(actions.onCreate).toHaveBeenCalledWith('EU')
    expect(onChange).toHaveBeenCalledWith([1, 3])
  })

  it('creates nothing for a contact that already has 3 tags', async () => {
    const all = buildSpaceAddressBookTags(3)
    const actions: TagActions = { onCreate: jest.fn(), onRename: jest.fn(), onDelete: jest.fn() }
    renderPicker({ tags: all, value: all.map((tag) => tag.id), actions })

    await open()
    await userEvent.type(screen.getByRole('searchbox'), 'Fourth')
    await userEvent.click(screen.getByRole('option', { name: /Create/ }))

    expect(screen.getByTestId('tag-menu-error')).toHaveTextContent('A contact can have at most 3 tags')
    expect(actions.onCreate).not.toHaveBeenCalled()
  })

  it('clears with "Clear"', async () => {
    const { onChange } = renderPicker({ value: [1] })

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onChange).toHaveBeenCalledWith([])
  })
})
