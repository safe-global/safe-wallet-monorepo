import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import LocalContactActions from './LocalContactActions'
import type { AddressBookEntry } from './SpaceAddressBookTable'

const mockDispatch = jest.fn()
const mockRemoveAddressBookEntry = jest.fn((payload: { chainId: string; address: string }) => ({
  type: 'addressBook/removeAddressBookEntry',
  payload,
}))
const mockShowNotification = jest.fn((payload: { message: string; variant: string; groupKey: string }) => ({
  type: 'notifications/showNotification',
  payload,
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/addressBookSlice', () => ({
  removeAddressBookEntry: (payload: { chainId: string; address: string }) => mockRemoveAddressBookEntry(payload),
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: { message: string; variant: string; groupKey: string }) => mockShowNotification(payload),
}))

jest.mock('@/components/address-book/EntryDialog', () => {
  const EntryDialog = ({
    defaultValues,
    chainIds,
    disableAddressInput,
  }: {
    defaultValues: { name: string; address: string }
    chainIds: string[]
    disableAddressInput?: boolean
  }) => (
    <div
      data-testid="entry-dialog"
      data-name={defaultValues.name}
      data-address={defaultValues.address}
      data-chain-count={chainIds.length}
      data-disable-address-input={String(Boolean(disableAddressInput))}
    />
  )
  return EntryDialog
})

jest.mock('@/components/common/ModalDialog', () => {
  const ModalDialog = ({
    open,
    dialogTitle,
    children,
  }: {
    open?: boolean
    dialogTitle?: React.ReactNode
    children: React.ReactNode
  }) =>
    open ? (
      <div role="dialog" aria-label={String(dialogTitle)}>
        {children}
      </div>
    ) : null
  return ModalDialog
})

const entry = (): AddressBookEntry => ({
  name: 'Local signer',
  address: checksumAddress('0x1234567890123456789012345678901234567890'),
  chainIds: ['1', '137'],
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
  isLocal: true,
})

describe('LocalContactActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('opens the edit dialog with the local contact values', async () => {
    render(<LocalContactActions entry={entry()} />)

    await userEvent.click(screen.getAllByRole('button')[0])

    expect(screen.getByTestId('entry-dialog')).toHaveAttribute('data-name', 'Local signer')
    expect(screen.getByTestId('entry-dialog')).toHaveAttribute(
      'data-address',
      checksumAddress('0x1234567890123456789012345678901234567890'),
    )
    expect(screen.getByTestId('entry-dialog')).toHaveAttribute('data-chain-count', '2')
    expect(screen.getByTestId('entry-dialog')).toHaveAttribute('data-disable-address-input', 'true')
  })

  it('removes the local contact on every network and shows a notification', async () => {
    const localEntry = entry()
    render(<LocalContactActions entry={localEntry} />)

    await userEvent.click(screen.getAllByRole('button')[1])
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(mockRemoveAddressBookEntry).toHaveBeenCalledWith({ chainId: '1', address: localEntry.address })
    expect(mockRemoveAddressBookEntry).toHaveBeenCalledWith({ chainId: '137', address: localEntry.address })
    expect(mockShowNotification).toHaveBeenCalledWith({
      message: 'Contact removed',
      variant: 'success',
      groupKey: 'remove-local-contact-success',
    })
    expect(mockDispatch).toHaveBeenCalledTimes(3)
  })
})
