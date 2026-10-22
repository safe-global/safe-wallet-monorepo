import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildSpaceAddressBookTags, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import TagPicker from '../TagPicker'

const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor', color: 'cobalt' }).build()
const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal', color: 'rose' }).build()
const workspaceTags = [vendor, internal]
const choice = ({ name, color }: { name: string; color: typeof vendor.color }) => ({ name, color })

const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Tags/ }))
  await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())
}

const createTag = async (text: string) => {
  await userEvent.type(screen.getByRole('searchbox'), text)
  await userEvent.click(screen.getByRole('option', { name: /Create/ }))
}

describe('TagPicker', () => {
  it('toggles an existing tag', async () => {
    const onChange = jest.fn()
    render(<TagPicker value={[]} onChange={onChange} workspaceTags={workspaceTags} />)

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))

    expect(onChange).toHaveBeenCalledWith([choice(vendor)])
  })

  it('creates a tag from the search text, with spaces collapsed, in a colour no tag uses', async () => {
    const onChange = jest.fn()
    render(<TagPicker value={[choice(internal)]} onChange={onChange} workspaceTags={workspaceTags} />)

    await open()
    await createTag('Key   vendors')

    const [[next]] = onChange.mock.calls
    expect(next).toEqual([choice(internal), { name: 'Key vendors', color: expect.any(String) }])
    expect(['cobalt', 'rose']).not.toContain(next[1].color)
  })

  it('takes the colour of the workspace tag a typed name matches', async () => {
    const onChange = jest.fn()
    render(<TagPicker value={[]} onChange={onChange} workspaceTags={workspaceTags} />)

    await open()
    await userEvent.type(screen.getByRole('searchbox'), 'Vend')
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))

    expect(onChange).toHaveBeenCalledWith([choice(vendor)])
  })

  it('offers no Create row for a tag the workspace has, ignoring case', async () => {
    const onChange = jest.fn()
    render(<TagPicker value={[]} onChange={onChange} workspaceTags={workspaceTags} />)

    await open()
    await userEvent.type(screen.getByRole('searchbox'), 'vendor{Enter}')

    expect(screen.queryByRole('option', { name: /Create/ })).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('explains why a tag name is rejected', async () => {
    const onChange = jest.fn()
    render(<TagPicker value={[]} onChange={onChange} workspaceTags={workspaceTags} />)

    await open()
    await createTag('Signer')

    expect(screen.getByTestId('tag-picker-error')).toHaveTextContent(
      "'Signer' is added automatically and can't be used as a tag name",
    )
    expect(onChange).not.toHaveBeenCalled()
  })

  it('refuses a fourth tag on the contact', async () => {
    const onChange = jest.fn()
    const extra = spaceAddressBookTagBuilder().with({ id: 3, name: 'EU' }).build()
    const payroll = spaceAddressBookTagBuilder().with({ id: 4, name: 'Payroll' }).build()
    render(
      <TagPicker
        value={[choice(vendor), choice(internal), choice(extra)]}
        onChange={onChange}
        workspaceTags={[...workspaceTags, extra, payroll]}
      />,
    )

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Payroll/ }))

    expect(screen.getByTestId('tag-picker-error')).toHaveTextContent('A contact can have at most 3 tags')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('refuses a ninth workspace tag and reports the limit', async () => {
    const onChange = jest.fn()
    const onLimitReached = jest.fn()
    render(
      <TagPicker
        value={[]}
        onChange={onChange}
        workspaceTags={buildSpaceAddressBookTags(8)}
        onLimitReached={onLimitReached}
      />,
    )

    await open()
    await createTag('One too many')

    expect(screen.getByTestId('tag-picker-error')).toHaveTextContent(
      'Your workspace has 8 tags. Rename or delete one to add another.',
    )
    expect(onChange).not.toHaveBeenCalled()
    expect(onLimitReached).toHaveBeenCalledTimes(1)
  })

  it('counts the tags it is about to create toward the workspace limit', async () => {
    const onChange = jest.fn()
    const tags = buildSpaceAddressBookTags(7).map((tag, index) => ({
      ...tag,
      color: (['slate', 'clay', 'rose', 'lilac', 'iris', 'cobalt', 'sky'] as const)[index],
    }))
    render(<TagPicker value={[{ name: 'New one', color: 'lagoon' }]} onChange={onChange} workspaceTags={tags} />)

    await open()
    await createTag('Another')

    expect(screen.getByTestId('tag-picker-error')).toHaveTextContent('Your workspace has 8 tags.')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('still lets the contact take an existing tag when the workspace is full', async () => {
    const onChange = jest.fn()
    const tags = buildSpaceAddressBookTags(8)
    render(<TagPicker value={[]} onChange={onChange} workspaceTags={tags} />)

    await open()
    await userEvent.click(screen.getByRole('option', { name: new RegExp(tags[0].name) }))

    expect(onChange).toHaveBeenCalledWith([choice(tags[0])])
  })

  it('lists a selected tag the workspace does not have yet', async () => {
    render(
      <TagPicker value={[{ name: 'Brand new', color: 'sky' }]} onChange={jest.fn()} workspaceTags={workspaceTags} />,
    )

    await open()

    expect(screen.getByRole('option', { name: /Brand new/ })).toHaveAttribute('aria-selected', 'true')
  })

  describe('rename and delete', () => {
    const editing = () => ({
      onRename: jest.fn().mockResolvedValue(undefined),
      onDelete: jest.fn().mockResolvedValue(undefined),
    })

    const rename = async (from: string, to: string) => {
      await userEvent.click(screen.getByRole('button', { name: `Rename ${from}` }))
      await userEvent.clear(screen.getByTestId('facet-option-rename-input'))
      await userEvent.type(screen.getByTestId('facet-option-rename-input'), `${to}{Enter}`)
    }

    const remove = async (name: string) => {
      await userEvent.click(screen.getByRole('button', { name: `Delete ${name}` }))
      await userEvent.click(screen.getByTestId('facet-option-confirm-delete'))
    }

    it('offers neither without tag editing', async () => {
      render(<TagPicker value={[]} onChange={jest.fn()} workspaceTags={workspaceTags} />)

      await open()

      expect(screen.queryByRole('button', { name: 'Rename Vendor' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Delete Vendor' })).not.toBeInTheDocument()
    })

    it('shows how many contacts have each tag', async () => {
      render(<TagPicker value={[]} onChange={jest.fn()} workspaceTags={[{ ...vendor, contactCount: 4 }]} />)

      await open()

      expect(screen.getByRole('option', { name: /Vendor\s*4/ })).toBeInTheDocument()
    })

    it('renames a selected workspace tag and keeps it selected in its colour', async () => {
      const tagEditing = editing()
      const onChange = jest.fn()
      render(
        <TagPicker
          value={[choice(vendor)]}
          onChange={onChange}
          workspaceTags={workspaceTags}
          tagEditing={tagEditing}
        />,
      )

      await open()
      await rename('Vendor', 'Supplier')

      expect(tagEditing.onRename).toHaveBeenCalledWith(vendor, 'Supplier')
      expect(onChange).toHaveBeenCalledWith([{ name: 'Supplier', color: vendor.color }])
    })

    it('takes the remaining tag when a rename merges two selected tags', async () => {
      const tagEditing = editing()
      const onChange = jest.fn()
      render(
        <TagPicker
          value={[choice(vendor), choice(internal)]}
          onChange={onChange}
          workspaceTags={workspaceTags}
          tagEditing={tagEditing}
        />,
      )

      await open()
      await rename('Vendor', 'internal')

      expect(onChange).toHaveBeenCalledWith([choice(internal)])
    })

    it('leaves the selection alone when an unselected tag is renamed', async () => {
      const tagEditing = editing()
      const onChange = jest.fn()
      render(
        <TagPicker
          value={[choice(internal)]}
          onChange={onChange}
          workspaceTags={workspaceTags}
          tagEditing={tagEditing}
        />,
      )

      await open()
      await rename('Vendor', 'Internal')

      expect(tagEditing.onRename).toHaveBeenCalledWith(vendor, 'Internal')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('keeps the editor open with the error a rename was refused with', async () => {
      const tagEditing = { ...editing(), onRename: jest.fn().mockResolvedValue('Too many requests') }
      const onChange = jest.fn()
      render(
        <TagPicker
          value={[choice(vendor)]}
          onChange={onChange}
          workspaceTags={workspaceTags}
          tagEditing={tagEditing}
        />,
      )

      await open()
      await rename('Vendor', 'Supplier')

      expect(screen.getByText('Too many requests')).toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled()
    })

    it('renames a tag created here without asking CGW', async () => {
      const tagEditing = editing()
      const onChange = jest.fn()
      render(
        <TagPicker
          value={[{ name: 'Brand new', color: 'sky' }]}
          onChange={onChange}
          workspaceTags={workspaceTags}
          tagEditing={tagEditing}
        />,
      )

      await open()
      await rename('Brand new', 'Renamed')

      expect(tagEditing.onRename).not.toHaveBeenCalled()
      expect(onChange).toHaveBeenCalledWith([{ name: 'Renamed', color: 'sky' }])
    })

    it('deletes a selected workspace tag and drops it from the selection', async () => {
      const tagEditing = editing()
      const onChange = jest.fn()
      render(
        <TagPicker
          value={[choice(vendor), choice(internal)]}
          onChange={onChange}
          workspaceTags={workspaceTags}
          tagEditing={tagEditing}
        />,
      )

      await open()
      await remove('Vendor')

      expect(tagEditing.onDelete).toHaveBeenCalledWith(vendor)
      expect(onChange).toHaveBeenCalledWith([choice(internal)])
    })

    it('drops a tag created here without asking CGW', async () => {
      const tagEditing = editing()
      const onChange = jest.fn()
      render(
        <TagPicker
          value={[{ name: 'Brand new', color: 'sky' }]}
          onChange={onChange}
          workspaceTags={workspaceTags}
          tagEditing={tagEditing}
        />,
      )

      await open()
      await remove('Brand new')

      expect(tagEditing.onDelete).not.toHaveBeenCalled()
      expect(onChange).toHaveBeenCalledWith([])
    })
  })
})
