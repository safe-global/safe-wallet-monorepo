import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportAddressBook from '../index'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { render } from '@/tests/test-utils'

jest.mock('@/hooks/useAllAddressBooks')
jest.mock('../ImportAddressBookDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="import-dialog" />,
}))

const mockedUseAllAddressBooks = useAllAddressBooks as jest.MockedFunction<typeof useAllAddressBooks>

describe('ImportAddressBook button', () => {
  it('disables the button when the local address book is empty', () => {
    mockedUseAllAddressBooks.mockReturnValue({})

    render(<ImportAddressBook />)

    expect(screen.getByRole('button', { name: /Import/i })).toBeDisabled()
  })

  it('disables the button when chains have no contacts', () => {
    mockedUseAllAddressBooks.mockReturnValue({ '1': {}, '5': {} })

    render(<ImportAddressBook />)

    expect(screen.getByRole('button', { name: /Import/i })).toBeDisabled()
  })

  it('shows a tooltip explaining why the button is disabled', async () => {
    mockedUseAllAddressBooks.mockReturnValue({})

    render(<ImportAddressBook />)

    await userEvent.hover(screen.getByRole('button', { name: /Import/i }).parentElement!)

    await waitFor(() => {
      expect(screen.getByText(/You don't have any contacts in your local address book/i)).toBeInTheDocument()
    })
  })

  it('enables the button when there are local contacts', () => {
    mockedUseAllAddressBooks.mockReturnValue({ '1': { '0x123': 'Alice' } })

    render(<ImportAddressBook />)

    expect(screen.getByRole('button', { name: /Import/i })).not.toBeDisabled()
  })

  it('does not render the tooltip text when there are local contacts', async () => {
    mockedUseAllAddressBooks.mockReturnValue({ '1': { '0x123': 'Alice' } })

    render(<ImportAddressBook />)

    await userEvent.hover(screen.getByRole('button', { name: /Import/i }))

    expect(screen.queryByText(/You don't have any contacts in your local address book/i)).not.toBeInTheDocument()
  })

  it('opens the dialog when an enabled button is clicked', async () => {
    mockedUseAllAddressBooks.mockReturnValue({ '1': { '0x123': 'Alice' } })

    render(<ImportAddressBook />)

    expect(screen.queryByTestId('import-dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Import/i }))

    expect(screen.getByTestId('import-dialog')).toBeInTheDocument()
  })
})
