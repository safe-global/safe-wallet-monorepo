import React, { act } from 'react'
import { screen, waitFor } from '@testing-library/react'
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

  it('bubbles the backend error message inline when the mutation returns an error', async () => {
    upsertionSpyFn.mockResolvedValue({
      error: { status: 422, data: { message: 'name must contain only valid characters' } },
    })

    mockedUseAllAddressBooks.mockReturnValue({
      '1': { '0x123': 'Alice' },
    })

    render(<ImportAddressBookDialog handleClose={jest.fn()} />)

    await userEvent.click(screen.getByText(/Alice/i))
    await userEvent.click(screen.getByText(/Import contacts \(1\)/i))

    await waitFor(() => {
      expect(screen.getByText(/name must contain only valid characters/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Import contacts \(1\)/i })).not.toBeDisabled()
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
})
