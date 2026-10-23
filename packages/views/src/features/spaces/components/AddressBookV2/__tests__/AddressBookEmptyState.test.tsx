import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddressBookEmptyState from '../AddressBookEmptyState'

describe('AddressBookEmptyState', () => {
  it('offers to clear a search that matches nothing', async () => {
    const onClearSearch = jest.fn()
    render(<AddressBookEmptyState kind="no-results" onClearSearch={onClearSearch} />)

    expect(screen.getByText('No contacts match')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(onClearSearch).toHaveBeenCalledTimes(1)
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
