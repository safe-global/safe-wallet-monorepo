import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceContextMenu from '../SpaceContextMenu'
import { downloadCsv } from '../../../utils/addressBookCsv'
import { showNotification } from '@/store/notificationsSlice'

const mockFetchAddressBook = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useLazyAddressBooksGetAddressBookItemsV1Query: () => [mockFetchAddressBook, { isFetching: false }],
}))
jest.mock('../../../utils/addressBookCsv', () => ({
  ...jest.requireActual('../../../utils/addressBookCsv'),
  downloadCsv: jest.fn(),
}))
jest.mock('@/store/notificationsSlice', () => ({
  ...jest.requireActual('@/store/notificationsSlice'),
  showNotification: jest.fn(() => ({ type: 'test/notification' })),
}))

const space = { uuid: 'space-1', name: 'Acme Inc', members: [] } as unknown as GetSpaceResponse

const openMenu = async () => {
  render(<SpaceContextMenu space={space} />)
  await userEvent.click(screen.getByTestId('space-card-context-menu-button'))
  return screen.findByTestId('download-address-book-button')
}

describe('SpaceContextMenu', () => {
  beforeEach(() => jest.clearAllMocks())

  it('downloads the shared address book fetched from the CGW as CSV', async () => {
    mockFetchAddressBook.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          spaceId: 'space-1',
          data: [{ address: '0x0000000000000000000000000000000000000001', name: 'Treasury', chainIds: ['1', '10'] }],
        }),
    })

    await userEvent.click(await openMenu())

    expect(mockFetchAddressBook).toHaveBeenCalledWith({ spaceId: 'space-1' })
    expect(downloadCsv).toHaveBeenCalledWith(
      'workspace-space-1-address-book.csv',
      [
        'address,name,chainId',
        '0x0000000000000000000000000000000000000001,Treasury,1',
        '0x0000000000000000000000000000000000000001,Treasury,10',
      ].join('\r\n'),
    )
    expect(showNotification).not.toHaveBeenCalled()
  })

  it('shows an error notification and downloads nothing when the request fails', async () => {
    mockFetchAddressBook.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })

    await userEvent.click(await openMenu())

    expect(downloadCsv).not.toHaveBeenCalled()
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }))
  })
})
