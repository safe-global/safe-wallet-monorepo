import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddContact from '../AddContact'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

const mockUpsertAddressBook = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    ADD_ADDRESS_SUBMIT: { action: 'Add address submit', category: 'spaces' },
    ADDRESS_BOOK_ENTRY_CREATED: { action: 'Address book entry created', category: 'spaces' },
  },
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBooksUpsertAddressBookItemsV1Mutation: () => [mockUpsertAddressBook],
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
  useGetSpaceAddressBook: () => [{ id: 1 }, { id: 2 }],
}))

type CapturedProps = {
  triggerLabel: string
  dialogTitle: string
  successMessage: string
  successGroupKey: string
  submit: (item: unknown, sid: string) => Promise<unknown>
  onSubmitStart?: () => void
  onSuccess?: () => void
}

let lastProps: CapturedProps | undefined

jest.mock('../AddContactDialog', () => ({
  __esModule: true,
  default: (props: CapturedProps) => {
    lastProps = props
    return <div data-testid="dialog-stub">{props.triggerLabel}</div>
  },
}))

describe('AddContact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastProps = undefined
  })

  it('passes the trigger label, dialog title, and success copy', () => {
    render(<AddContact label="Add shared contact" />)

    expect(lastProps?.triggerLabel).toBe('Add shared contact')
    expect(lastProps?.dialogTitle).toBe('Add contact')
    expect(lastProps?.successMessage).toBe('Added contact')
    expect(lastProps?.successGroupKey).toBe('add-contact-success')
    expect(screen.getByTestId('dialog-stub')).toHaveTextContent('Add shared contact')
  })

  it('defaults the trigger label to "Add contact"', () => {
    render(<AddContact />)
    expect(lastProps?.triggerLabel).toBe('Add contact')
  })

  it('submit calls the shared-address-book mutation with the right payload', async () => {
    mockUpsertAddressBook.mockResolvedValue({})
    render(<AddContact />)

    await lastProps!.submit({ name: 'Alice', address: '0xabc', chainIds: ['1'] }, '42')

    expect(mockUpsertAddressBook).toHaveBeenCalledWith({
      spaceId: 42,
      upsertAddressBookItemsDto: { items: [{ name: 'Alice', address: '0xabc', chainIds: ['1'] }] },
    })
  })

  it('onSubmitStart tracks ADD_ADDRESS_SUBMIT', () => {
    render(<AddContact />)
    lastProps!.onSubmitStart!()

    expect(trackEvent).toHaveBeenCalledWith({ ...SPACE_EVENTS.ADD_ADDRESS_SUBMIT })
  })

  it('onSuccess tracks ADDRESS_BOOK_ENTRY_CREATED with workspace id and post-insert count', () => {
    render(<AddContact />)
    lastProps!.onSuccess!()

    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.ADDRESS_BOOK_ENTRY_CREATED },
      { workspace_id: '42', entry_count_after: 3 },
    )
  })

  it('renders without crashing when invoked', async () => {
    render(<AddContact />)
    await waitFor(() => expect(screen.getByTestId('dialog-stub')).toBeInTheDocument())
    fireEvent(screen.getByTestId('dialog-stub'), new Event('click'))
  })
})
