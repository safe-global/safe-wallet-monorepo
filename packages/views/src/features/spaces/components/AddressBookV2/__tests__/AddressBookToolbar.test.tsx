import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddressBookToolbar from '../AddressBookToolbar'

describe('AddressBookToolbar', () => {
  it('reports what the member types into the search', async () => {
    const onQueryChange = jest.fn()
    render(<AddressBookToolbar query="" onQueryChange={onQueryChange} />)

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search contacts by name or address' }), 'a')

    expect(onQueryChange).toHaveBeenCalledWith('a')
  })

  it('clears the search', async () => {
    const onQueryChange = jest.fn()
    render(<AddressBookToolbar query="atlas" onQueryChange={onQueryChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(onQueryChange).toHaveBeenCalledWith('')
  })

  it('renders the filters and the actions it is given', () => {
    render(
      <AddressBookToolbar
        query=""
        onQueryChange={jest.fn()}
        filters={<button>Filters</button>}
        actions={<button>Add contact</button>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add contact' })).toBeInTheDocument()
  })
})
