import { faker } from '@faker-js/faker'
import userEvent from '@testing-library/user-event'
import { fakerChecksummedAddress, fakerLookalikeAddress, render, screen, waitFor, within } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import { ADDRESS_POISONING_EVENTS, MixpanelEventParams, trackEvent } from '@/services/analytics'
import { getStoreInstance } from '@/store'
import ImportDialog from '..'

jest.mock('@/services/analytics')

const CHAIN_ID = '11155111'
const HEADER = 'address,name,chainId'

const csvFile = (rows: string[]) => new File([[HEADER, ...rows].join('\n')], 'address-book.csv', { type: 'text/csv' })

const renderDialog = (options?: Parameters<typeof render>[1]) => {
  const handleClose = jest.fn()
  render(<ImportDialog handleClose={handleClose} />, options)
  const input = document.body.querySelector('input[type="file"]') as HTMLInputElement
  return { handleClose, input }
}

const uploadAndImport = async (input: HTMLInputElement, file: File) => {
  const user = userEvent.setup()
  await user.upload(input, file)
  await waitFor(() => expect(screen.getByTestId('import-btn')).toBeEnabled())
  await user.click(screen.getByTestId('import-btn'))
}

describe('ImportDialog', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('imports every row of a valid CSV into the address book of its chain', async () => {
    const entries = Array.from({ length: 4 }, () => [fakerChecksummedAddress(), faker.person.firstName()])
    const { handleClose, input } = renderDialog()

    await uploadAndImport(input, csvFile(entries.map(([address, name]) => `${address},${name},${CHAIN_ID}`)))

    expect(getStoreInstance().getState().addressBook[CHAIN_ID]).toEqual(Object.fromEntries(entries))
    expect(handleClose).toHaveBeenCalled()
  })

  it('keeps existing entries that are not in the file', async () => {
    const existing = fakerChecksummedAddress()
    const imported = fakerChecksummedAddress()
    const { input } = renderDialog({ initialReduxState: { addressBook: { [CHAIN_ID]: { [existing]: 'Existing' } } } })

    await uploadAndImport(input, csvFile([`${imported},Imported,${CHAIN_ID}`]))

    expect(getStoreInstance().getState().addressBook[CHAIN_ID]).toEqual({
      [existing]: 'Existing',
      [imported]: 'Imported',
    })
  })

  it('keeps the last name when an address appears twice on one chain', async () => {
    const address = fakerChecksummedAddress()
    const { input } = renderDialog()

    await uploadAndImport(input, csvFile([`${address},First,${CHAIN_ID}`, `${address},Second,${CHAIN_ID}`]))

    expect(getStoreInstance().getState().addressBook[CHAIN_ID]).toEqual({ [address]: 'Second' })
  })

  it('counts the entries and distinct chains of the file in the summary', async () => {
    const chainIds = ['1', ' 100', '56', '1']
    const { input } = renderDialog()

    await userEvent
      .setup()
      .upload(input, csvFile(chainIds.map((chainId) => `${fakerChecksummedAddress()},Name,${chainId}`)))

    expect(await screen.findByText('Found 4 entries on 3 chains')).toBeInTheDocument()
  })

  it('shows an error and keeps Import disabled for a file with only the header', async () => {
    const { input } = renderDialog()

    await userEvent.setup().upload(input, csvFile([]))

    expect(await screen.findByText('No entries found in address book')).toBeInTheDocument()
    expect(screen.getByTestId('import-btn')).toBeDisabled()
  })

  it('rejects a file that is not a CSV and keeps Import disabled', async () => {
    const { input } = renderDialog()

    await userEvent
      .setup({ applyAccept: false })
      .upload(input, new File(['{"a":1}'], 'balances.json', { type: 'application/json' }))

    expect(await screen.findByText('File type must be text/csv', { exact: false })).toBeInTheDocument()
    expect(screen.getByTestId('import-btn')).toBeDisabled()
  })
})

describe('ImportDialog look-alike check', () => {
  const contact = fakerChecksummedAddress()
  const contactName = faker.person.fullName()
  const lookalike = fakerLookalikeAddress(contact)
  const clean = fakerChecksummedAddress()
  const initialReduxState = { addressBook: { [CHAIN_ID]: { [contact]: contactName } } }
  const rows = (...addresses: string[]) =>
    addresses.map((address) => `${address},${faker.person.firstName()},${CHAIN_ID}`)

  const savedAddresses = () => Object.keys(getStoreInstance().getState().addressBook[CHAIN_ID] ?? {})
  const confirmDialog = () => screen.findByRole('dialog', { name: 'Similar addresses detected' })

  beforeEach(() => {
    jest.clearAllMocks()
    // An imported look-alike is persisted and would be hydrated back as a saved address in the next test.
    localStorage.clear()
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
  })

  it('says how many addresses in the file look like other addresses', async () => {
    const { input } = renderDialog({ initialReduxState })

    await userEvent.setup().upload(input, csvFile(rows(lookalike, clean)))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '1 address in this file looks similar to other addresses.',
    )
  })

  it('asks the user to verify instead of import when look-alikes are found', async () => {
    const { input } = renderDialog({ initialReduxState })

    await userEvent.setup().upload(input, csvFile(rows(lookalike, clean)))

    await waitFor(() => expect(screen.getByTestId('import-btn')).toHaveTextContent('Verify'))
  })

  it('keeps the Import label when no address looks like another', async () => {
    const { input } = renderDialog({ initialReduxState })

    await userEvent.setup().upload(input, csvFile(rows(clean)))

    await waitFor(() => expect(screen.getByTestId('import-btn')).toBeEnabled())
    expect(screen.getByTestId('import-btn')).toHaveTextContent('Import')
  })

  it('skips the look-alike rows when the user chooses to skip them', async () => {
    const { input } = renderDialog({ initialReduxState })

    await uploadAndImport(input, csvFile(rows(lookalike, clean)))
    await userEvent.setup().click(within(await confirmDialog()).getByText('No, skip similar addresses'))

    await waitFor(() => expect(savedAddresses()).toEqual([contact, clean]))
  })

  it('imports every row when the user includes the look-alikes', async () => {
    const { input } = renderDialog({ initialReduxState })

    await uploadAndImport(input, csvFile(rows(lookalike, clean)))
    await userEvent.setup().click(within(await confirmDialog()).getByText('Yes, import them anyway'))

    await waitFor(() => expect(savedAddresses()).toEqual([contact, lookalike, clean]))
  })

  it('imports straight away when no address looks like another', async () => {
    const { input } = renderDialog({ initialReduxState })

    await uploadAndImport(input, csvFile(rows(clean)))

    await waitFor(() => expect(savedAddresses()).toEqual([contact, clean]))
    expect(screen.queryByRole('dialog', { name: 'Similar addresses detected' })).not.toBeInTheDocument()
  })

  it('keeps a saved address in the file when skipping the look-alike that imitates it', async () => {
    const renamed = faker.person.firstName()
    const { input } = renderDialog({ initialReduxState })

    await uploadAndImport(input, csvFile([`${contact},${renamed},${CHAIN_ID}`, ...rows(lookalike)]))
    await userEvent.setup().click(within(await confirmDialog()).getByText('No, skip similar addresses'))

    await waitFor(() => expect(getStoreInstance().getState().addressBook[CHAIN_ID]).toEqual({ [contact]: renamed }))
  })

  it('imports straight away when the ADDRESS_POISONING_PROTECTION flag is off', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
    const { input } = renderDialog({ initialReduxState })

    await uploadAndImport(input, csvFile(rows(lookalike, clean)))

    await waitFor(() => expect(savedAddresses()).toEqual([contact, lookalike, clean]))
    expect(screen.queryByRole('dialog', { name: 'Similar addresses detected' })).not.toBeInTheDocument()
  })

  it('tracks the warning and the decision to import anyway', async () => {
    const params = { [MixpanelEventParams.LOCATION]: 'address_book_import' }
    const { input } = renderDialog({ initialReduxState })

    await uploadAndImport(input, csvFile(rows(lookalike, clean)))
    expect(trackEvent).toHaveBeenCalledWith(ADDRESS_POISONING_EVENTS.WARNING_SHOWN, params)

    await userEvent.setup().click(within(await confirmDialog()).getByText('Yes, import them anyway'))

    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(ADDRESS_POISONING_EVENTS.WARNING_CONTINUED, params))
    expect(trackEvent).not.toHaveBeenCalledWith(ADDRESS_POISONING_EVENTS.WARNING_DISMISSED, expect.anything())
  })

  it('tracks the decision to skip the look-alikes', async () => {
    const { input } = renderDialog({ initialReduxState })

    await uploadAndImport(input, csvFile(rows(lookalike, clean)))
    await userEvent.setup().click(within(await confirmDialog()).getByText('No, skip similar addresses'))

    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith(ADDRESS_POISONING_EVENTS.WARNING_DISMISSED, {
        [MixpanelEventParams.LOCATION]: 'address_book_import',
        [MixpanelEventParams.DISMISS_ACTION]: 'skip',
      }),
    )
  })

  it('tracks the decision to close the confirmation', async () => {
    const { input } = renderDialog({ initialReduxState })

    await uploadAndImport(input, csvFile(rows(lookalike, clean)))
    await userEvent.setup().click(within(await confirmDialog()).getByRole('button', { name: 'Close' }))

    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith(ADDRESS_POISONING_EVENTS.WARNING_DISMISSED, {
        [MixpanelEventParams.LOCATION]: 'address_book_import',
        [MixpanelEventParams.DISMISS_ACTION]: 'cancel',
      }),
    )
    expect(savedAddresses()).toEqual([contact])
  })
})
