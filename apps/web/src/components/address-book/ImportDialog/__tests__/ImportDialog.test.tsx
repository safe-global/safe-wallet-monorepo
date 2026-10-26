import { faker } from '@faker-js/faker'
import userEvent from '@testing-library/user-event'
import { fakerChecksummedAddress, render, screen, waitFor } from '@/tests/test-utils'
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
