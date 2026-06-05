import React, { act } from 'react'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportAddressBookDialog from '../ImportAddressBookDialog'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { render } from '@/tests/test-utils'
import useChains from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import * as spacesRTK from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

jest.mock('@/hooks/useAllAddressBooks')
jest.mock('@/hooks/useChains')
const mockedUseAllAddressBooks = useAllAddressBooks as jest.MockedFunction<typeof useAllAddressBooks>
const mockedUseChains = useChains as jest.MockedFunction<typeof useChains>
const upsertionSpyFn = jest.fn()
const upsertionSpy = jest
  .spyOn(spacesRTK, 'useAddressBooksUpsertAddressBookItemsV1Mutation')
  .mockReturnValue([upsertionSpyFn, { reset: jest.fn() }])

describe('ImportAddressBookDialog', () => {
  beforeEach(() => {
    mockedUseChains.mockReturnValue({ configs: [{ chainId: '1' } as Chain, { chainId: '5' } as Chain] })
    upsertionSpyFn.mockReset()
  })

  afterAll(() => {
    upsertionSpy.mockRestore()
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

    const selectAliceButton = screen.getByText(/Alice/i)
    await userEvent.click(selectAliceButton)

    const selectCharlieButton = screen.getByText(/Charlie/i)
    await userEvent.click(selectCharlieButton)

    const importButton = screen.getByText(/Import contacts \(2\)/i)
    expect(importButton).toBeInTheDocument()

    await userEvent.click(importButton)
    expect(upsertionSpyFn).toHaveBeenCalledTimes(1)

    const callArgs = upsertionSpyFn.mock.calls[0][0]['upsertAddressBookItemsDto']['items']
    expect(callArgs).toHaveLength(2)
    expect(callArgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chainIds: ['1'],
          address: '0x123',
          name: 'Alice',
        }),
        expect.objectContaining({
          chainIds: ['5'],
          address: '0xABC',
          name: 'Charlie',
        }),
      ]),
    )
  })

  it('disables the Import button when no contacts are selected', () => {
    mockedUseAllAddressBooks.mockReturnValue({
      '1': { '0x123': 'Alice' },
    })

    render(<ImportAddressBookDialog handleClose={jest.fn()} />)

    expect(screen.getByRole('button', { name: /Import contacts \(0\)/i })).toBeDisabled()
  })

  it('disables the Import button and delays closing after a successful import', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) })
    upsertionSpyFn.mockResolvedValue({ data: {} })

    mockedUseAllAddressBooks.mockReturnValue({
      '1': { '0x123': 'Alice' },
    })
    const handleClose = jest.fn()

    render(<ImportAddressBookDialog handleClose={handleClose} />)

    await user.click(screen.getByText(/Alice/i))
    await user.click(screen.getByText(/Import contacts \(1\)/i))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Import contacts \(1\)/i })).toBeDisabled()
    })
    expect(handleClose).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(500))
    expect(handleClose).toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  it('shows an inline error when the mutation returns an error', async () => {
    upsertionSpyFn.mockResolvedValue({ error: { status: 500 } })

    mockedUseAllAddressBooks.mockReturnValue({
      '1': { '0x123': 'Alice' },
    })

    render(<ImportAddressBookDialog handleClose={jest.fn()} />)

    await userEvent.click(screen.getByText(/Alice/i))
    await userEvent.click(screen.getByText(/Import contacts \(1\)/i))

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong\. Please try again\./i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Import contacts \(1\)/i })).not.toBeDisabled()
  })

  it('clears the import error when switching tabs', async () => {
    upsertionSpyFn.mockResolvedValue({ error: { status: 500 } })

    mockedUseAllAddressBooks.mockReturnValue({
      '1': { '0x123': 'Alice' },
    })

    render(<ImportAddressBookDialog handleClose={jest.fn()} />)

    await userEvent.click(screen.getByText(/Alice/i))
    await userEvent.click(screen.getByText(/Import contacts \(1\)/i))

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong\. Please try again\./i)).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('tab', { name: /upload file/i }))

    await waitFor(() => {
      expect(screen.queryByText(/Something went wrong\. Please try again\./i)).not.toBeInTheDocument()
    })
  })

  it('filters the contact list based on the search input', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) })

    mockedUseAllAddressBooks.mockReturnValue({
      '1': {
        '0x123': 'Alice',
        '0x456': 'Bob',
      },
    })

    render(<ImportAddressBookDialog handleClose={jest.fn()} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/Search/i), 'Alice')
    act(() => jest.advanceTimersByTime(300))

    await waitFor(() => {
      expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Alice')).toBeInTheDocument()

    jest.useRealTimers()
  })

  it('renders both the local contacts and upload file tabs', () => {
    mockedUseAllAddressBooks.mockReturnValue({ '1': { '0x123': 'Alice' } })

    render(<ImportAddressBookDialog handleClose={jest.fn()} />)

    expect(screen.getByRole('tab', { name: /local contacts/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /upload file/i })).toBeInTheDocument()
  })

  it('parses an uploaded CSV file and upserts the entries into the space', async () => {
    mockedUseAllAddressBooks.mockReturnValue({})
    upsertionSpyFn.mockResolvedValue({ data: {} })

    render(<ImportAddressBookDialog handleClose={jest.fn()} />)

    // Empty local address book defaults to the upload tab
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const csv = 'address,name,chainId\n0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b,Alice,1'
    fireEvent.change(input, { target: { files: [new File([csv], 'book.csv', { type: 'text/csv' })] } })

    const importButton = await screen.findByRole('button', { name: /Import \(1\)/i })
    await waitFor(() => expect(importButton).not.toBeDisabled())
    await userEvent.click(importButton)

    expect(upsertionSpyFn).toHaveBeenCalledTimes(1)
    const items = upsertionSpyFn.mock.calls[0][0]['upsertAddressBookItemsDto']['items']
    expect(items).toEqual([{ address: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b', name: 'Alice', chainIds: ['1'] }])
  })
})
