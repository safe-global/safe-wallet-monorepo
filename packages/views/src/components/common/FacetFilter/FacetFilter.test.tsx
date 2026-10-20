import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FacetFilter, { type FacetOption } from './index'

const options: FacetOption[] = [
  { value: 'safe', label: 'Workspace account', count: 3 },
  { value: 'signer', label: 'Signer', count: 5 },
  { value: 'external', label: 'External', count: 12 },
]

const openFilter = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Role/ }))
  await waitFor(() => expect(screen.getByRole('listbox', { name: 'Role' })).toBeInTheDocument())
}

describe('FacetFilter', () => {
  it('lists the options with their counts when opened', async () => {
    render(<FacetFilter label="Role" options={options} value={[]} onChange={jest.fn()} />)

    await openFilter()

    expect(screen.getByRole('option', { name: /Workspace account/ })).toHaveTextContent('3')
    expect(screen.getByRole('option', { name: /Signer/ })).toHaveTextContent('5')
    expect(screen.getByRole('option', { name: /External/ })).toHaveTextContent('12')
  })

  it('toggles an option and keeps the popover open', async () => {
    const onChange = jest.fn()
    render(<FacetFilter label="Role" options={options} value={['safe']} onChange={onChange} />)

    await openFilter()
    expect(screen.getByRole('option', { name: /Workspace account/ })).toHaveAttribute('aria-selected', 'true')

    await userEvent.click(screen.getByRole('option', { name: /Signer/ }))
    expect(onChange).toHaveBeenCalledWith(['safe', 'signer'])
    expect(screen.getByRole('listbox', { name: 'Role' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('option', { name: /Workspace account/ }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('shows the number of selected options on the trigger', () => {
    render(<FacetFilter label="Role" options={options} value={['safe', 'external']} onChange={jest.fn()} />)

    expect(screen.getByTestId('facet-filter-count')).toHaveTextContent('2')
  })

  it('filters the options by the search text', async () => {
    render(<FacetFilter label="Role" options={options} value={[]} onChange={jest.fn()} searchable />)

    await openFilter()
    await userEvent.type(screen.getByRole('searchbox'), 'sign')

    expect(screen.getByRole('option', { name: /Signer/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /External/ })).not.toBeInTheDocument()
  })

  it('offers to create an unknown value when onCreate is provided', async () => {
    const onCreate = jest.fn()
    render(
      <FacetFilter label="Role" options={options} value={[]} onChange={jest.fn()} searchable onCreate={onCreate} />,
    )

    await openFilter()
    await userEvent.type(screen.getByRole('searchbox'), 'Vendor')
    await userEvent.click(screen.getByRole('option', { name: /Create/ }))

    expect(onCreate).toHaveBeenCalledWith('Vendor')
  })

  it('does not offer to create a value that already exists, ignoring case', async () => {
    render(
      <FacetFilter label="Role" options={options} value={[]} onChange={jest.fn()} searchable onCreate={jest.fn()} />,
    )

    await openFilter()
    await userEvent.type(screen.getByRole('searchbox'), 'signer')

    expect(screen.queryByRole('option', { name: /Create/ })).not.toBeInTheDocument()
  })

  it('clears the selection from the footer', async () => {
    const onChange = jest.fn()
    render(<FacetFilter label="Role" options={options} value={['safe']} onChange={onChange} />)

    await openFilter()
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('renames an option on Enter with the trimmed text and closes the editor', async () => {
    const onRenameOption = jest.fn().mockResolvedValue(undefined)
    render(
      <FacetFilter label="Role" options={options} value={[]} onChange={jest.fn()} onRenameOption={onRenameOption} />,
    )

    await openFilter()
    await userEvent.click(screen.getByRole('button', { name: 'Rename Signer' }))
    const input = screen.getByTestId('facet-option-rename-input')
    expect(input).toHaveValue('Signer')

    await userEvent.clear(input)
    await userEvent.type(input, '  Co-signer  {Enter}')

    expect(onRenameOption).toHaveBeenCalledWith('signer', 'Co-signer')
    await waitFor(() => expect(screen.queryByTestId('facet-option-rename-input')).not.toBeInTheDocument())
  })

  it('keeps the editor open and shows the error when the rename is rejected', async () => {
    const onRenameOption = jest.fn().mockResolvedValue('Tags cannot be empty')
    render(
      <FacetFilter label="Role" options={options} value={[]} onChange={jest.fn()} onRenameOption={onRenameOption} />,
    )

    await openFilter()
    await userEvent.click(screen.getByRole('button', { name: 'Rename Signer' }))
    await userEvent.clear(screen.getByTestId('facet-option-rename-input'))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Tags cannot be empty')
    expect(screen.getByTestId('facet-option-rename-input')).toBeInTheDocument()
  })

  it('cancels the rename on Escape without calling the handler', async () => {
    const onRenameOption = jest.fn()
    render(
      <FacetFilter label="Role" options={options} value={[]} onChange={jest.fn()} onRenameOption={onRenameOption} />,
    )

    await openFilter()
    await userEvent.click(screen.getByRole('button', { name: 'Rename Signer' }))
    await userEvent.type(screen.getByTestId('facet-option-rename-input'), ' 2{Escape}')

    expect(onRenameOption).not.toHaveBeenCalled()
    expect(screen.queryByTestId('facet-option-rename-input')).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Signer/ })).toBeInTheDocument()
  })

  it('asks for confirmation before deleting an option', async () => {
    const onDeleteOption = jest.fn()
    render(
      <FacetFilter
        label="Role"
        options={options}
        value={[]}
        onChange={jest.fn()}
        onDeleteOption={onDeleteOption}
        deleteConfirmation={(option) => `Remove ${option.value} from ${option.count} contacts?`}
      />,
    )

    await openFilter()
    await userEvent.click(screen.getByRole('button', { name: 'Delete External' }))
    expect(screen.getByText('Remove external from 12 contacts?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onDeleteOption).not.toHaveBeenCalled()
    expect(screen.queryByTestId('facet-option-confirm-delete')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Delete External' }))
    await userEvent.click(screen.getByTestId('facet-option-confirm-delete'))

    expect(onDeleteOption).toHaveBeenCalledWith('external')
    await waitFor(() => expect(screen.queryByTestId('facet-option-confirm-delete')).not.toBeInTheDocument())
  })

  it('shows no rename or delete actions on a locked option', async () => {
    render(
      <FacetFilter
        label="Role"
        options={[{ ...options[0], locked: true }, ...options.slice(1)]}
        value={[]}
        onChange={jest.fn()}
        onRenameOption={jest.fn()}
        onDeleteOption={jest.fn()}
      />,
    )

    await openFilter()

    expect(screen.queryByRole('button', { name: 'Rename Workspace account' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete Workspace account' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rename Signer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Signer' })).toBeInTheDocument()
  })

  it('shows no rename or delete actions without handlers', async () => {
    render(<FacetFilter label="Role" options={options} value={[]} onChange={jest.fn()} />)

    await openFilter()

    expect(screen.queryByRole('button', { name: /^Rename/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Delete/ })).not.toBeInTheDocument()
  })
})
