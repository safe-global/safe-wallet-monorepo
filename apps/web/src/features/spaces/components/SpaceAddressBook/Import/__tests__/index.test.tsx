import { screen } from '@testing-library/react'
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
  it('is enabled even when the local address book is empty (file import is still available)', () => {
    mockedUseAllAddressBooks.mockReturnValue({})

    render(<ImportAddressBook />)

    expect(screen.getByRole('button', { name: /Import/i })).not.toBeDisabled()
  })

  it('is enabled when there are local contacts', () => {
    mockedUseAllAddressBooks.mockReturnValue({ '1': { '0x123': 'Alice' } })

    render(<ImportAddressBook />)

    expect(screen.getByRole('button', { name: /Import/i })).not.toBeDisabled()
  })

  it('opens the dialog when the button is clicked, even with an empty local address book', async () => {
    mockedUseAllAddressBooks.mockReturnValue({})

    render(<ImportAddressBook />)

    expect(screen.queryByTestId('import-dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Import/i }))

    expect(screen.getByTestId('import-dialog')).toBeInTheDocument()
  })
})
