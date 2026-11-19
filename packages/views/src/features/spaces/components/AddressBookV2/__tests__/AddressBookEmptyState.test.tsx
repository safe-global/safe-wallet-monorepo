import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddressBookEmptyState from '../AddressBookEmptyState'

describe('AddressBookEmptyState', () => {
  it('offers to clear the search and filters of Workspace contacts that match nothing', async () => {
    const onClear = jest.fn()
    render(<AddressBookEmptyState kind="no-results" book="workspace" onClear={onClear} />)

    expect(screen.getByText('No contacts match')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('offers to clear a search of local contacts that matches nothing', async () => {
    const onClear = jest.fn()
    render(<AddressBookEmptyState kind="no-results" book="local" onClear={onClear} />)

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('explains an empty workspace book and shows its actions', () => {
    render(<AddressBookEmptyState kind="empty" book="workspace" actions={<button>Add contact</button>} />)

    expect(screen.getByText('No contacts yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add contact' })).toBeInTheDocument()
  })

  it('explains an empty local book', () => {
    render(<AddressBookEmptyState kind="empty" book="local" />)

    expect(screen.getByText('No local contacts yet')).toBeInTheDocument()
  })
})
