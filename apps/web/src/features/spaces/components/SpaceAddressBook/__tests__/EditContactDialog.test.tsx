import type * as ReactHookForm from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { spaceAddressBookTagBuilder } from '@/tests/builders/space'
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
  useWorkspaceAddressBookLabel: () => 'Acme address book',
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: { EDIT_ADDRESS_SUBMIT: { action: 'Edit address submit', category: 'spaces' } },
}))

const mockCreateTag = jest.fn()
jest.mock('../../SpaceAddressBookV2/useTagActions', () => ({
  __esModule: true,
  default: () => ({
    tagActions: { onCreate: mockCreateTag, onRename: jest.fn(), onDelete: jest.fn() },
  }),
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
  tagIds: [1],
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

  it('dispatches a workspace-labeled "updated" notification on success', async () => {
    mockUpsertAddressBook.mockResolvedValue({ data: {} })

    render(<EditContactDialog entry={entry} onClose={jest.fn()} />)
    await submitForm()

    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/show',
        payload: expect.objectContaining({
          message: 'Contact updated in Acme address book',
          variant: 'success',
        }),
      }),
    )
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

  describe('tags', () => {
    const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor' }).build()
    const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal' }).build()

    const sentItem = () => mockUpsertAddressBook.mock.lastCall?.[0].upsertAddressBookItemsDto.items[0]

    it('has no Tags field and sends no tags outside the v2 address book', async () => {
      mockUpsertAddressBook.mockResolvedValue({ data: {} })
      render(<EditContactDialog entry={entry} onClose={jest.fn()} />)

      expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument()
      await submitForm()

      await waitFor(() => expect(mockUpsertAddressBook).toHaveBeenCalled())
      expect(sentItem()).not.toHaveProperty('tags')
    })

    it('leaves the tags alone when only the name changes', async () => {
      mockUpsertAddressBook.mockResolvedValue({ data: {} })
      render(<EditContactDialog entry={entry} onClose={jest.fn()} workspaceTags={[vendor, internal]} />)

      expect(screen.getByTestId('tag-chip')).toHaveTextContent('Vendor')
      await submitForm()

      await waitFor(() => expect(mockUpsertAddressBook).toHaveBeenCalled())
      expect(sentItem()).not.toHaveProperty('tags')
    })

    it('sends the full set of tags once they change', async () => {
      mockUpsertAddressBook.mockResolvedValue({ data: {} })
      render(<EditContactDialog entry={entry} onClose={jest.fn()} workspaceTags={[vendor, internal]} />)

      await userEvent.click(screen.getByTestId('tag-picker'))
      await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())
      await userEvent.click(screen.getByRole('option', { name: /Internal/ }))
      await userEvent.keyboard('{Escape}')
      const submitButton = screen.getByRole('button', { name: 'Save' })
      await waitFor(() => expect(submitButton).not.toBeDisabled())
      fireEvent.click(submitButton)

      await waitFor(() => expect(mockUpsertAddressBook).toHaveBeenCalled())
      expect(sentItem()).toEqual(expect.objectContaining({ tags: ['Vendor', 'Internal'] }))
    })
  })
})
