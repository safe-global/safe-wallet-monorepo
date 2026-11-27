import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import DeleteContactDialog from '../DeleteContactDialog'

const SPACE_ID = '42'
const GENERIC_ERROR = 'Something went wrong deleting the contact. Please try again.'
const ELEVATION_REQUIRED = { status: 403, data: { message: 'elevation_required' } }

const mockDispatch = jest.fn()
const mockDeleteEntry = jest.fn()

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('../../../public/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => SPACE_ID,
}))
jest.mock('../../../public/hooks/useWorkspaceAddressBookLabel', () => ({
  useWorkspaceAddressBookLabel: () => 'Acme address book',
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBooksDeleteByAddressV1Mutation: () => [mockDeleteEntry],
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/components/common/ChainIndicatorList', () => ({
  __esModule: true,
  default: ({ chainIds }: { chainIds: string[] }) => <div data-testid="networks">{chainIds.join(',')}</div>,
}))

const renderDialog = (onClose = jest.fn()) => {
  const contact = { name: faker.person.firstName(), address: faker.finance.ethereumAddress(), networks: ['1', '137'] }
  render(<DeleteContactDialog {...contact} onClose={onClose} />)
  return { contact, onClose }
}

const confirm = () => userEvent.click(screen.getByRole('button', { name: 'Remove' }))

describe('DeleteContactDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('names the contact and the networks the removal applies to', () => {
    const { contact } = renderDialog()

    expect(screen.getByText(contact.name)).toBeInTheDocument()
    expect(screen.getByTestId('networks')).toHaveTextContent('1,137')
  })

  it('deletes the contact by address from the current Workspace', async () => {
    mockDeleteEntry.mockResolvedValue({ data: undefined })
    const { contact } = renderDialog()

    await confirm()

    expect(mockDeleteEntry).toHaveBeenCalledWith({ spaceId: SPACE_ID, address: contact.address })
  })

  it('shows a Workspace-labelled success notification and closes after the deletion', async () => {
    mockDeleteEntry.mockResolvedValue({ data: undefined })
    const { onClose } = renderDialog()

    await confirm()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'notifications/show',
      payload: expect.objectContaining({ message: 'Contact removed from Acme address book', variant: 'success' }),
    })
  })

  it('shows an error and stays open when the gateway returns an error', async () => {
    mockDeleteEntry.mockResolvedValue({ error: { status: 500, data: {} } })
    const { onClose } = renderDialog()

    await confirm()

    expect(await screen.findByText(GENERIC_ERROR)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows an error and stays open when the request throws', async () => {
    mockDeleteEntry.mockRejectedValue(new Error('Network error'))
    const { onClose } = renderDialog()

    await confirm()

    expect(await screen.findByText(GENERIC_ERROR)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows no error and stays open when the gateway asks for a step-up', async () => {
    mockDeleteEntry.mockResolvedValue({ error: ELEVATION_REQUIRED })
    const { onClose } = renderDialog()

    await confirm()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove' })).toBeEnabled())
    expect(screen.queryByText(GENERIC_ERROR)).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes without deleting on Cancel', async () => {
    const { onClose } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalled()
    expect(mockDeleteEntry).not.toHaveBeenCalled()
  })
})
