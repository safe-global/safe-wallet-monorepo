import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import AddToWorkspaceButton from '../AddToWorkspaceButton'
import { getStoreInstance } from '@/store'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { faker } from '@faker-js/faker'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const mockUpsert = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBooksUpsertAddressBookItemsV1Mutation: () => [mockUpsert],
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => MOCK_SPACE_UUID,
}))

describe('AddToWorkspaceButton', () => {
  const address = checksumAddress(faker.finance.ethereumAddress())

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('adds the contact to the workspace address book', async () => {
    mockUpsert.mockResolvedValue({ data: {} })
    render(<AddToWorkspaceButton address={address} name="Alice" chainIds={['1', '137']} />, {
      initialReduxState: { addressBook: { '1': { [address]: 'Alice' }, '137': { [address]: 'Alice' } } },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Add to workspace' }))

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith({
        spaceId: MOCK_SPACE_UUID,
        upsertAddressBookItemsDto: { items: [{ name: 'Alice', address, chainIds: ['1', '137'] }] },
      })
    })

    await waitFor(() => expect(screen.getByText('Added')).toBeInTheDocument())
  })

  it('keeps the contact in the local address book after adding to the workspace', async () => {
    mockUpsert.mockResolvedValue({ data: {} })
    render(<AddToWorkspaceButton address={address} name="Alice" chainIds={['1', '137']} />, {
      initialReduxState: { addressBook: { '1': { [address]: 'Alice' }, '137': { [address]: 'Alice' } } },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Add to workspace' }))

    await waitFor(() => expect(mockUpsert).toHaveBeenCalled())

    const addressBook = getStoreInstance().getState().addressBook
    expect(addressBook['1'][address]).toBe('Alice')
    expect(addressBook['137'][address]).toBe('Alice')
  })

  it('does not remove the local entry when the workspace add fails', async () => {
    mockUpsert.mockResolvedValue({ error: { status: 500, data: {} } })
    render(<AddToWorkspaceButton address={address} name="Alice" chainIds={['1']} />, {
      initialReduxState: { addressBook: { '1': { [address]: 'Alice' } } },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Add to workspace' }))

    await waitFor(() => expect(mockUpsert).toHaveBeenCalled())

    expect(getStoreInstance().getState().addressBook['1'][address]).toBe('Alice')
    expect(screen.queryByText('Added')).not.toBeInTheDocument()
  })

  it('surfaces the backend error message in the toast', async () => {
    mockUpsert.mockResolvedValue({
      error: { status: 422, data: { message: 'Name contains invalid characters' } },
    })
    render(<AddToWorkspaceButton address={address} name="Alice" chainIds={['1']} />, {
      initialReduxState: { addressBook: { '1': { [address]: 'Alice' } } },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Add to workspace' }))

    await waitFor(() => {
      const notifications = getStoreInstance().getState().notifications
      expect(notifications.some((n) => n.message === 'Name contains invalid characters')).toBe(true)
    })
  })

  it('falls back to a friendly message when the backend provides none', async () => {
    mockUpsert.mockResolvedValue({ error: { status: 500, data: {} } })
    render(<AddToWorkspaceButton address={address} name="Alice" chainIds={['1']} />, {
      initialReduxState: { addressBook: { '1': { [address]: 'Alice' } } },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Add to workspace' }))

    await waitFor(() => {
      const notifications = getStoreInstance().getState().notifications
      expect(notifications.some((n) => /Something went wrong \(500\)\. Please try again/.test(n.message))).toBe(true)
    })
  })
})
