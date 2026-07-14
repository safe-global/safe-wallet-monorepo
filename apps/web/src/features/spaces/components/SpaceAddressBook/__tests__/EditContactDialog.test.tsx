import type * as ReactHookForm from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditContactDialog from '../EditContactDialog'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const mockDispatch = jest.fn()
const mockUpsertAddressBook = jest.fn()

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: { EDIT_ADDRESS_SUBMIT: { action: 'Edit address submit', category: 'spaces' } },
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1', chainName: 'Ethereum' }] }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBooksUpsertAddressBookItemsV1Mutation: () => [mockUpsertAddressBook],
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/components/common/AddressInputReadOnly', () => ({
  __esModule: true,
  default: () => <div data-testid="address-readonly" />,
}))

jest.mock('@/components/common/NameInput', () => ({
  __esModule: true,
  default: ({ name, label }: { name: string; label: string }) => {
    const { register } = (jest.requireActual('react-hook-form') as typeof ReactHookForm).useFormContext()
    return <input aria-label={label} {...register(name, { required: true })} />
  },
}))

jest.mock('@/components/common/NetworkSelector/NetworkMultiSelectorInput', () => ({
  __esModule: true,
  default: () => <div data-testid="network-selector" />,
}))

const entry: SpaceAddressBookItemDto = {
  name: 'Alice',
  address: '0xabc',
  chainIds: ['1'],
  createdBy: '0xabc',
  createdByUserId: 1,
  lastUpdatedBy: '0xabc',
  lastUpdatedByUserId: 1,
  createdAt: '',
  updatedAt: '',
}

const submitForm = async () => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice Updated' } })
  const submitButton = screen.getByRole('button', { name: 'Save' })
  await waitFor(() => expect(submitButton).not.toBeDisabled())
  fireEvent.click(submitButton)
}

describe('EditContactDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('bubbles the backend error message from result.error', async () => {
    mockUpsertAddressBook.mockResolvedValue({
      error: { status: 422, data: { message: 'Name contains invalid characters' } },
    })

    render(<EditContactDialog entry={entry} onClose={jest.fn()} />)
    await submitForm()

    expect(await screen.findByText('Name contains invalid characters')).toBeInTheDocument()
  })

  it('bubbles the backend error message when the mutation throws', async () => {
    mockUpsertAddressBook.mockRejectedValue({ status: 422, data: { message: 'Invalid characters in name' } })

    render(<EditContactDialog entry={entry} onClose={jest.fn()} />)
    await submitForm()

    expect(await screen.findByText('Invalid characters in name')).toBeInTheDocument()
  })

  it('falls back to a generic error when the backend provides no message', async () => {
    mockUpsertAddressBook.mockResolvedValue({ error: { status: 500, data: {} } })

    render(<EditContactDialog entry={entry} onClose={jest.fn()} />)
    await submitForm()

    expect(await screen.findByText(/Something went wrong \(500\)/)).toBeInTheDocument()
  })

  it('treats a name that sanitizes back to the saved name as unchanged', async () => {
    render(<EditContactDialog entry={entry} onClose={jest.fn()} />)

    const nameInput = screen.getByLabelText('Name')
    const submitButton = screen.getByRole('button', { name: 'Save' })

    fireEvent.change(nameInput, { target: { value: 'Bob' } })
    await waitFor(() => expect(submitButton).not.toBeDisabled())

    fireEvent.change(nameInput, { target: { value: 'Alice ' } })
    await waitFor(() => expect(submitButton).toBeDisabled())

    fireEvent.click(submitButton)
    expect(mockUpsertAddressBook).not.toHaveBeenCalled()
  })
})
