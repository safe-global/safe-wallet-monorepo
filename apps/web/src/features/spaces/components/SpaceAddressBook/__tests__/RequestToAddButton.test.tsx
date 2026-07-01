import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import RequestToAddButton from '../RequestToAddButton'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { faker } from '@faker-js/faker'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const mockCreateRequest = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBookRequestsCreateRequestV1Mutation: () => [mockCreateRequest],
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => MOCK_SPACE_UUID,
  useGetSpaceAddressBook: () => [],
}))

describe('RequestToAddButton', () => {
  const address = checksumAddress(faker.finance.ethereumAddress())

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends the full contact in one request and keeps the dialog flow', async () => {
    mockCreateRequest.mockResolvedValue({ data: {} })
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1', '137']} />, {
      initialReduxState: { addressBook: { '1': { [address]: 'Alice' }, '137': { [address]: 'Alice' } } },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    expect(screen.getByText('Request to add contact')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('confirm-request-btn'))

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        spaceId: MOCK_SPACE_UUID,
        createAddressBookRequestDto: { address, name: 'Alice', chainIds: ['1', '137'] },
      })
    })

    await waitFor(() => expect(screen.getByText('Requested')).toBeInTheDocument())
  })

  it('submits the sanitized name so it matches the validated value', async () => {
    mockCreateRequest.mockResolvedValue({ data: {} })
    render(<RequestToAddButton address={address} name=" Alice‚Bob " chainIds={['1']} />, {
      initialReduxState: { addressBook: { '1': { [address]: ' Alice‚Bob ' } } },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.click(screen.getByTestId('confirm-request-btn'))

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        spaceId: MOCK_SPACE_UUID,
        createAddressBookRequestDto: { address, name: "Alice'Bob", chainIds: ['1'] },
      })
    })
  })

  it('disables the button and does not open the dialog when the name has invalid characters', async () => {
    render(<RequestToAddButton address={address} name="José 🦄" chainIds={['1']} />)

    const button = screen.getByRole('button', { name: 'Request to add' })
    expect(button).toBeDisabled()

    await userEvent.click(button)

    expect(screen.queryByText('Request to add contact')).not.toBeInTheDocument()
    expect(mockCreateRequest).not.toHaveBeenCalled()
  })

  it('shows a tooltip explaining why an invalid-name contact cannot be requested', async () => {
    render(<RequestToAddButton address={address} name="José 🦄" chainIds={['1']} />)

    await userEvent.hover(screen.getByRole('button', { name: 'Request to add' }).parentElement as HTMLElement)

    await waitFor(() => expect(screen.getByText(/Rename this contact to add it to the workspace/)).toBeInTheDocument())
  })

  it('keeps the button enabled for a valid name', () => {
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1']} />)

    expect(screen.getByRole('button', { name: 'Request to add' })).not.toBeDisabled()
  })

  it('treats an already-pending request (409) as requested', async () => {
    mockCreateRequest.mockResolvedValue({ error: { status: 409, data: {} } })
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1']} />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.click(screen.getByTestId('confirm-request-btn'))

    await waitFor(() => expect(screen.getByText('Requested')).toBeInTheDocument())
  })

  it('renders the requested badge when a pending request already exists', () => {
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1']} alreadyRequested />)

    expect(screen.getByText('Requested')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request to add' })).not.toBeInTheDocument()
  })
})
