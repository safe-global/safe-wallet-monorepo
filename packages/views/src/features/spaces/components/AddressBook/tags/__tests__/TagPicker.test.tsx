import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagPicker from '../TagPicker'

const options = [
  { tag: 'Internal', count: 3 },
  { tag: 'Vendor', count: 1 },
]

const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Tags/ }))
  await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())
}

describe('TagPicker', () => {
  it('toggles an existing tag', async () => {
    const onChange = jest.fn()
    render(<TagPicker value={[]} onChange={onChange} options={options} />)

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))

    expect(onChange).toHaveBeenCalledWith(['Vendor'])
  })

  it('creates a new tag from the search text', async () => {
    const onChange = jest.fn()
    render(<TagPicker value={['Internal']} onChange={onChange} options={options} />)

    await open()
    await userEvent.type(screen.getByRole('searchbox'), 'Payroll')
    await userEvent.click(screen.getByRole('option', { name: /Create/ }))

    expect(onChange).toHaveBeenCalledWith(['Internal', 'Payroll'])
  })

  it('reuses the spelling already in the book instead of creating a duplicate', async () => {
    const onChange = jest.fn()
    render(<TagPicker value={[]} onChange={onChange} options={options} />)

    await open()
    await userEvent.type(screen.getByRole('searchbox'), 'vendor{Enter}')

    // "vendor" already exists as "Vendor", so no Create row and Enter creates nothing
    expect(screen.queryByRole('option', { name: /Create/ })).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows the gateway rule when a created tag is invalid', async () => {
    const onChange = jest.fn()
    render(<TagPicker value={[]} onChange={onChange} options={options} />)

    await open()
    await userEvent.type(screen.getByRole('searchbox'), '=SUM(1)')
    await userEvent.click(screen.getByRole('option', { name: /Create/ }))

    expect(screen.getByTestId('tag-picker-error')).toHaveTextContent('Tags cannot start with =, +, - or @')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('refuses an eleventh tag', async () => {
    const onChange = jest.fn()
    const ten = Array.from({ length: 10 }, (_, i) => `Tag ${i}`)
    render(<TagPicker value={ten} onChange={onChange} options={options} />)

    await open()
    await userEvent.click(screen.getByRole('option', { name: /Vendor/ }))

    expect(screen.getByTestId('tag-picker-error')).toHaveTextContent('at most 10 tags')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('lists a selected tag that is not in the book yet', async () => {
    render(<TagPicker value={['Brand new']} onChange={jest.fn()} options={options} />)

    await open()

    expect(screen.getByRole('option', { name: /Brand new/ })).toHaveAttribute('aria-selected', 'true')
  })
})
