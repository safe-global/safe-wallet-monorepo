import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildSpaceAddressBookTags, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import type { TagActions } from '../TagMenu'
import TagFilterDropdown, { type TagFilterDropdownProps } from '../TagFilterDropdown'

const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor' }).build()
const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal' }).build()

const renderDropdown = (props: Partial<TagFilterDropdownProps> = {}) => {
  const onChange = jest.fn()
  const result = render(<TagFilterDropdown tags={[vendor, internal]} value={[]} onChange={onChange} {...props} />)
  return { ...result, onChange }
}

const open = async () => {
  await userEvent.click(screen.getByTestId('filters-dropdown'))
  await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())
}

describe('TagFilterDropdown', () => {
  it('lets any number of tags be ticked', async () => {
    const all = buildSpaceAddressBookTags(4)
    const { onChange } = renderDropdown({ tags: all, value: all.slice(0, 3).map((tag) => tag.id) })

    await open()
    await userEvent.click(screen.getByRole('option', { name: new RegExp(all[3].name) }))

    expect(onChange).toHaveBeenCalledWith(all.map((tag) => tag.id))
  })

  it('shows how many filters are on, and clears them', async () => {
    const { onChange } = renderDropdown({ value: [1, 2] })
    expect(screen.getByTestId('tag-menu-count')).toHaveTextContent('2')

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('creates a tag at once and leaves the filters alone', async () => {
    const actions: TagActions = {
      onCreate: jest.fn().mockResolvedValue({ tag: spaceAddressBookTagBuilder().with({ id: 3 }).build() }),
      onRename: jest.fn(),
      onDelete: jest.fn(),
    }
    const { onChange } = renderDropdown({ actions })

    await open()
    await userEvent.type(screen.getByRole('searchbox'), 'EU')
    await userEvent.click(screen.getByRole('option', { name: /Create/ }))

    expect(actions.onCreate).toHaveBeenCalledWith('EU')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reports the filters once it closes after the user changed them', async () => {
    const onFiltersChanged = jest.fn()
    const Controlled = () => {
      const [value, setValue] = useState<number[]>([])
      return (
        <TagFilterDropdown
          tags={[vendor, internal]}
          value={value}
          onChange={setValue}
          onFiltersChanged={onFiltersChanged}
        />
      )
    }
    render(<Controlled />)

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))
    await userEvent.keyboard('{Escape}')

    expect(onFiltersChanged).toHaveBeenCalledTimes(1)
    expect(onFiltersChanged).toHaveBeenCalledWith([1])
  })

  it('reports nothing when a rename or delete changed the filters', async () => {
    const onFiltersChanged = jest.fn()
    const { rerender, onChange } = renderDropdown({ value: [1], onFiltersChanged })

    await open()
    rerender(
      <TagFilterDropdown tags={[internal]} value={[2]} onChange={onChange} onFiltersChanged={onFiltersChanged} />,
    )
    await userEvent.keyboard('{Escape}')

    expect(onFiltersChanged).not.toHaveBeenCalled()
  })
})
