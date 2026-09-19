import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import RequestToAddButton from '../RequestToAddButton'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { faker } from '@faker-js/faker'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const mockCreateRequest = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBookRequestsCreateRequestV1Mutation: () => [mockCreateRequest],
}))

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => MOCK_SPACE_UUID,
  useGetSpaceAddressBook: () => [],
}))

let mockConfigs: { chainId: string }[] = []

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockConfigs }),
  useChain: () => undefined,
}))

describe('RequestToAddButton', () => {
  const address = checksumAddress(faker.finance.ethereumAddress())

  beforeEach(() => {
    jest.clearAllMocks()
    mockConfigs = [{ chainId: '1' }, { chainId: '137' }]
  })

  it('keeps the confirm button disabled while the chain config is empty', async () => {
    mockConfigs = []
    render(<RequestToAddButton address={address} name="Alice" />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))

    expect(screen.getByTestId('confirm-request-btn')).toBeDisabled()
    expect(mockCreateRequest).not.toHaveBeenCalled()
  })

  it('sends the full contact in one request and keeps the dialog flow', async () => {
    mockCreateRequest.mockResolvedValue({ data: {} })
    render(<RequestToAddButton address={address} name="Alice" />, {
      initialReduxState: { addressBook: { '1': { [address]: 'Alice' }, '137': { [address]: 'Alice' } } },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    expect(screen.getByText('Request to add contact')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Address')).toBeInTheDocument()

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
    render(<RequestToAddButton address={address} name=" Alice‚Bob " />, {
      initialReduxState: { addressBook: { '1': { [address]: ' Alice‚Bob ' } } },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.click(screen.getByTestId('confirm-request-btn'))

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        spaceId: MOCK_SPACE_UUID,
        createAddressBookRequestDto: { address, name: "Alice'Bob", chainIds: ['1', '137'] },
      })
    })
  })

  it('disables the button and does not open the dialog when the name has invalid characters', async () => {
    render(<RequestToAddButton address={address} name="José 🦄" />)

    const button = screen.getByRole('button', { name: 'Request to add' })
    expect(button).toBeDisabled()

    await userEvent.click(button)

    expect(screen.queryByText('Request to add contact')).not.toBeInTheDocument()
    expect(mockCreateRequest).not.toHaveBeenCalled()
  })

  it('shows a tooltip explaining why an invalid-name contact cannot be requested', async () => {
    render(<RequestToAddButton address={address} name="José 🦄" />)

    await userEvent.hover(screen.getByRole('button', { name: 'Request to add' }).parentElement as HTMLElement)

    await waitFor(() => expect(screen.getByText(/Rename this contact to add it to the workspace/)).toBeInTheDocument())
  })

  it('keeps the button enabled for a valid name', () => {
    render(<RequestToAddButton address={address} name="Alice" />)

    expect(screen.getByRole('button', { name: 'Request to add' })).not.toBeDisabled()
  })

  it('treats an already-pending request (409) as requested', async () => {
    mockCreateRequest.mockResolvedValue({ error: { status: 409, data: {} } })
    render(<RequestToAddButton address={address} name="Alice" />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.click(screen.getByTestId('confirm-request-btn'))

    await waitFor(() => expect(screen.getByText('Requested')).toBeInTheDocument())
  })

  it('renders the requested badge when a pending request already exists', () => {
    render(<RequestToAddButton address={address} name="Alice" alreadyRequested />)

    expect(screen.getByText('Requested')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request to add' })).not.toBeInTheDocument()
  })

  it('drops the label into the accessible name in the compact layout', () => {
    render(<RequestToAddButton address={address} name="Alice" isCompact />)

    expect(screen.getByRole('button', { name: 'Request to add' })).toHaveTextContent('')
  })

  it('shows the requested state as an icon in the compact layout', () => {
    render(<RequestToAddButton address={address} name="Alice" alreadyRequested isCompact />)

    expect(screen.getByLabelText('Requested')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request to add' })).not.toBeInTheDocument()
  })

  it('tracks the request once it is created', async () => {
    mockCreateRequest.mockResolvedValue({ data: {} })
    render(<RequestToAddButton address={address} name="Alice" />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.click(screen.getByTestId('confirm-request-btn'))

    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.ADDRESS_REQUEST_SENT))
  })

  it('does not track when a request was already pending (409)', async () => {
    mockCreateRequest.mockResolvedValue({ error: { status: 409 } })
    render(<RequestToAddButton address={address} name="Alice" />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.click(screen.getByTestId('confirm-request-btn'))

    await waitFor(() => expect(screen.getByText('Requested')).toBeInTheDocument())
    expect(trackEvent).not.toHaveBeenCalled()
  })
})
