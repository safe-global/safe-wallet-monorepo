import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { fakerChecksummedAddress, fireEvent, render, screen, waitFor, within } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import * as analytics from '@/services/analytics'
import * as addressBookSlice from '@/store/addressBookSlice'
import { ADDRESS_POISONING_EVENTS, MixpanelEventParams } from '@/services/analytics'
import type { RootState } from '@/store'
import ImportDialog from '..'

let mockCsvRows: string[][] = []

jest.mock('react-papaparse', () => {
  const { useEffect } = jest.requireActual('react')
  // Defined once so every render gets the same component type; a fresh one per call would remount it.
  const MockCSVReader = ({
    children,
    onUploadAccepted,
  }: {
    children: (props: object) => ReactElement
    onUploadAccepted: (result: object) => void
  }) => {
    useEffect(() => {
      onUploadAccepted({ data: mockCsvRows, errors: [], meta: {} })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps -- upload once on mount
    return children({
      getRootProps: () => ({}),
      acceptedFile: { name: 'address-book.csv', size: 100 },
      getRemoveFileProps: () => ({ onClick: jest.fn() }),
    })
  }
  return { ...jest.requireActual('react-papaparse'), useCSVReader: () => ({ CSVReader: MockCSVReader }) }
})

const lookalikeOf = (address: string) =>
  getAddress(
    `0x${address.slice(2, 6)}${faker.string.hexadecimal({ length: 32, prefix: '' })}${address.slice(-4)}`.toLowerCase(),
  )

describe('ImportDialog look-alike check', () => {
  const contact = fakerChecksummedAddress()
  const lookalike = lookalikeOf(contact)
  const clean = fakerChecksummedAddress()
  const initialReduxState = { addressBook: { '1': { [contact]: faker.person.fullName() } } } as Partial<RootState>

  beforeEach(() => {
    jest.clearAllMocks()
    // An imported look-alike is persisted and would be hydrated back as a saved address in the next test.
    localStorage.clear()
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    mockCsvRows = [
      ['address', 'name', 'chainId'],
      [lookalike, 'Vendor A', '1'],
      [clean, 'Payroll', '1'],
    ]
  })

  const renderDialog = () => render(<ImportDialog handleClose={jest.fn()} />, { initialReduxState })
  const importedAddresses = (spy: jest.SpyInstance) => spy.mock.calls.map(([entry]) => entry.address)
  const confirmDialog = () => screen.findByRole('dialog', { name: 'Similar addresses detected' })

  it('says how many addresses in the file look like other addresses', async () => {
    renderDialog()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '1 address in this file looks similar to other addresses.',
    )
  })

  it('skips the look-alike rows when the user chooses to skip them', async () => {
    const spy = jest.spyOn(addressBookSlice, 'upsertAddressBookEntries')
    renderDialog()

    fireEvent.click(await screen.findByTestId('import-btn'))
    fireEvent.click(within(await confirmDialog()).getByText('No, skip similar addresses'))

    await waitFor(() => expect(importedAddresses(spy)).toEqual([clean]))
  })

  it('imports every row when the user includes the look-alikes', async () => {
    const spy = jest.spyOn(addressBookSlice, 'upsertAddressBookEntries')
    renderDialog()

    fireEvent.click(await screen.findByTestId('import-btn'))
    fireEvent.click(within(await confirmDialog()).getByText('Yes, import them anyway'))

    await waitFor(() => expect(importedAddresses(spy)).toEqual([lookalike, clean]))
  })

  it('imports straight away when no address looks like another', async () => {
    mockCsvRows = [
      ['address', 'name', 'chainId'],
      [clean, 'Payroll', '1'],
    ]
    const spy = jest.spyOn(addressBookSlice, 'upsertAddressBookEntries')
    renderDialog()

    fireEvent.click(await screen.findByTestId('import-btn'))

    await waitFor(() => expect(importedAddresses(spy)).toEqual([clean]))
    expect(screen.queryByRole('dialog', { name: 'Similar addresses detected' })).not.toBeInTheDocument()
  })

  it('tracks the warning and the decision to import anyway', async () => {
    const trackEvent = jest.spyOn(analytics, 'trackEvent')
    const params = { [MixpanelEventParams.LOCATION]: 'address_book_import' }
    renderDialog()

    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(ADDRESS_POISONING_EVENTS.WARNING_SHOWN, params))

    fireEvent.click(await screen.findByTestId('import-btn'))
    fireEvent.click(within(await confirmDialog()).getByText('Yes, import them anyway'))

    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(ADDRESS_POISONING_EVENTS.WARNING_CONTINUED, params))
  })
})
