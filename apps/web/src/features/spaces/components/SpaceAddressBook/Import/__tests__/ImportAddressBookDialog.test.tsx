import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportAddressBookDialog from '../ImportAddressBookDialog'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { render } from '@/tests/test-utils'
import useChains from '@/hooks/useChains'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
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
    mockedUseChains.mockReturnValue({ configs: [{ chainId: '1' } as ChainInfo, { chainId: '5' } as ChainInfo] })
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
})
