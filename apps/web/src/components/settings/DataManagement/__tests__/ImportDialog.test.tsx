import { faker } from '@faker-js/faker'
import { fireEvent, fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import { getStoreInstance } from '@/store'
import { ImportDialog } from '../ImportDialog'

jest.mock('@/services/analytics')

const CHAIN_ID = '11155111'

const renderDialog = (jsonData: string) => {
  const onClose = jest.fn()
  render(
    <ImportDialog
      fileName="data.json"
      jsonData={jsonData}
      setFileName={jest.fn()}
      setJsonData={jest.fn()}
      onClose={onClose}
    />,
  )
  return { onClose }
}

describe('ImportDialog', () => {
  it('lists what the file contains and imports it into the store', () => {
    const safeAddress = fakerChecksummedAddress()
    const safe = { owners: [], threshold: 1 }
    const addressBook = { [CHAIN_ID]: { [fakerChecksummedAddress()]: faker.person.firstName() } }
    const json = JSON.stringify({
      version: '3.0',
      data: {
        addressBook,
        addedSafes: { [CHAIN_ID]: { [safeAddress]: safe } },
        settings: { ...settingsInitialState, currency: 'eur' },
        safeApps: { [CHAIN_ID]: { pinned: [24], opened: [] } },
      },
    })
    const { onClose } = renderDialog(json)

    expect(screen.getByText('Added Safe accounts').closest('li')).toHaveTextContent('Added Safe accounts on 1 chain')
    expect(screen.getByText('Address book').closest('li')).toHaveTextContent('Address book for 1 chain')
    expect(screen.getByText('Safe Apps').closest('li')).toHaveTextContent('Bookmarked Safe Apps')

    fireEvent.click(screen.getByTestId('dialog-import-btn'))

    const state = getStoreInstance().getState()
    expect(state.addressBook).toEqual(addressBook)
    expect(state.addedSafes[CHAIN_ID]).toEqual({ [safeAddress]: safe })
    expect(state.safeApps[CHAIN_ID].pinned).toEqual([24])
    expect(state.settings.currency).toBe('eur')
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps Import disabled when the file has no importable data', () => {
    renderDialog('{}')

    expect(screen.getByText('This file contains no importable data.')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-import-btn')).toBeDisabled()
  })
})
