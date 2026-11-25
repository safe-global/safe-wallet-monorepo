import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import RequestToAddButton from '../RequestToAddButton'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { faker } from '@faker-js/faker'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const IS_ADMIN = false
const mockCreateRequest = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBookRequestsCreateRequestV1Mutation: () => [mockCreateRequest],
  useAddressBooksUpsertAddressBookItemsV1Mutation: () => [jest.fn()],
}))

jest.mock('../../../public/hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => MOCK_SPACE_UUID }))

jest.mock('../../../public/hooks/useGetSpaceAddressBook', () => ({
  __esModule: true,
  default: () => [],
  useSpaceAddressBookState: () => ({ items: [], isLoading: false, isError: false }),
}))

jest.mock('../../../public/hooks/useSpaceMembers', () => ({ useIsAdmin: () => IS_ADMIN, useIsInvited: () => false }))

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
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
    expect(screen.getByRole('textbox', { name: 'Name for Alice' })).toHaveAttribute('placeholder', 'Alice')

    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

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
    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        spaceId: MOCK_SPACE_UUID,
        createAddressBookRequestDto: { address, name: "Alice'Bob", chainIds: ['1'] },
      })
    })
  })

  it('sends the name edited in the dialog', async () => {
    mockCreateRequest.mockResolvedValue({ data: {} })
    render(<RequestToAddButton address={address} name="Treasury signer 2" chainIds={['1']} />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Name for Treasury signer 2' }), 'Alice')
    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        spaceId: MOCK_SPACE_UUID,
        createAddressBookRequestDto: { address, name: 'Alice', chainIds: ['1'] },
      })
    })
  })

  it('blocks an invalid name in the dialog until it is fixed', async () => {
    mockCreateRequest.mockResolvedValue({ data: {} })
    render(<RequestToAddButton address={address} name="José 🦄" chainIds={['1']} />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    const input = screen.getByRole('textbox', { name: 'Name for José 🦄' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByTestId('name-contacts-confirm-btn')).toBeDisabled()

    await userEvent.type(input, 'Jose')
    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        spaceId: MOCK_SPACE_UUID,
        createAddressBookRequestDto: { address, name: 'Jose', chainIds: ['1'] },
      })
    })
  })

  it('treats an already-pending request (409) as requested', async () => {
    mockCreateRequest.mockResolvedValue({ error: { status: 409, data: {} } })
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1']} />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

    await waitFor(() => expect(screen.getByText('Requested')).toBeInTheDocument())
  })

  it('renders the requested badge when a pending request already exists', () => {
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1']} alreadyRequested />)

    expect(screen.getByText('Requested')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request to add' })).not.toBeInTheDocument()
  })

  it('drops the label into the accessible name in the compact layout', () => {
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1']} isCompact />)

    expect(screen.getByRole('button', { name: 'Request to add' })).toHaveTextContent('')
  })

  it('shows the requested state as an icon in the compact layout', () => {
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1']} alreadyRequested isCompact />)

    expect(screen.getByLabelText('Requested')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request to add' })).not.toBeInTheDocument()
  })

  it('tracks the request once it is created', async () => {
    mockCreateRequest.mockResolvedValue({ data: {} })
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1']} />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.ADDRESS_REQUEST_SENT))
  })

  it('does not track when a request was already pending (409)', async () => {
    mockCreateRequest.mockResolvedValue({ error: { status: 409 } })
    render(<RequestToAddButton address={address} name="Alice" chainIds={['1']} />)

    await userEvent.click(screen.getByRole('button', { name: 'Request to add' }))
    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

    await waitFor(() => expect(screen.getByText('Requested')).toBeInTheDocument())
    expect(trackEvent).not.toHaveBeenCalled()
  })
})
