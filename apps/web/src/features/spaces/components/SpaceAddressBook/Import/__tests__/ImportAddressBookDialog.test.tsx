import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportAddressBookDialog from '../ImportAddressBookDialog'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { render } from '@/tests/test-utils'

jest.mock('@/hooks/useAllAddressBooks')
const mockedUseAllAddressBooks = useAllAddressBooks as jest.MockedFunction<typeof useAllAddressBooks>
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

describe('ImportAddressBookDialog', () => {
  afterAll(() => {
    consoleLogSpy.mockRestore()
  })

  it('renders the dialog with a list of contacts', () => {
    mockedUseAllAddressBooks.mockReturnValue({
      '1': {
        '0x123': 'Alice',
        '0x456': 'Bob',
      },
      '5': {
        '0xABC': 'Charlie',
      },
    })

    const handleClose = jest.fn()

    render(<ImportAddressBookDialog handleClose={handleClose} />)

    expect(screen.getByText(/Import address book/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('calls handleClose when cancel button is clicked', async () => {
    mockedUseAllAddressBooks.mockReturnValue({})
    const handleClose = jest.fn()

    render(<ImportAddressBookDialog handleClose={handleClose} />)
    const cancelButton = screen.getByTestId('cancel-btn')
    await userEvent.click(cancelButton)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('selects all contacts when "Select all" is clicked', async () => {
    mockedUseAllAddressBooks.mockReturnValue({
      '1': {
        '0x123': 'Alice',
        '0x456': 'Bob',
      },
      '5': {
        '0xABC': 'Charlie',
      },
    })
    const handleClose = jest.fn()

    render(<ImportAddressBookDialog handleClose={handleClose} />)

    const selectAllButton = screen.getByText(/select all/i)
    expect(selectAllButton).toBeInTheDocument()

    const importButton = screen.getByText(/Import contacts \(0\)/i)
    expect(importButton).toBeInTheDocument()

    await userEvent.click(selectAllButton)

    expect(screen.getByText(/Import contacts \(3\)/i)).toBeInTheDocument()
  })

  it('submits the form and logs the result to console', async () => {
    mockedUseAllAddressBooks.mockReturnValue({
      '1': {
        '0x123': 'Alice',
      },
      '5': {
        '0xABC': 'Charlie',
      },
    })
    const handleClose = jest.fn()

    render(<ImportAddressBookDialog handleClose={handleClose} />)

    const selectAllButton = screen.getByText(/select all/i)
    await userEvent.click(selectAllButton)

    const importButton = screen.getByText(/Import contacts \(2\)/i)
    expect(importButton).toBeInTheDocument()

    await userEvent.click(importButton)
    expect(consoleLogSpy).toHaveBeenCalledTimes(1)

    const callArgs = consoleLogSpy.mock.calls[0][0]
    expect(callArgs).toHaveLength(2)
    expect(callArgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chainId: '1',
          address: '0x123',
          name: 'Alice',
        }),
        expect.objectContaining({
          chainId: '5',
          address: '0xABC',
          name: 'Charlie',
        }),
      ]),
    )
  })
})
