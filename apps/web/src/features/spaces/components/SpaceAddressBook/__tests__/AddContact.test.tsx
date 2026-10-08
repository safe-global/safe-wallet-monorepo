import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddContact from '../AddContact'
import { AddContactDialogView as MockAddContactDialogView } from '@views/features/spaces/components/SpaceAddressBook/AddContactDialogView'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'

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
  useCurrentSpaceId: () => '11111111-1111-1111-1111-111111111111',
  useGetSpaceAddressBook: () => [{ id: 1 }, { id: 2 }],
  useWorkspaceAddressBookLabel: () => 'Acme address book',
}))

type CapturedProps = {
  triggerLabel?: string
  dialogTitle?: string
  successMessage: string
  successGroupKey: string
  submit: (item: unknown, sid: string) => Promise<unknown>
  onSubmitStart?: () => void
  onSuccess?: () => void
}

let lastProps: CapturedProps | undefined

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open, dialogTitle }: { children: React.ReactNode; open: boolean; dialogTitle: string }) =>
    open ? (
      <div role="dialog" aria-label={dialogTitle}>
        {children}
      </div>
    ) : null,
}))

jest.mock('../AddContactDialog', () => ({
  __esModule: true,
  default: (props: CapturedProps) => {
    lastProps = props
    return (
      <div data-testid="dialog-stub">
        <MockAddContactDialogView
          open
          onOpen={() => {}}
          onClose={() => {}}
          triggerLabel={props.triggerLabel}
          dialogTitle={props.dialogTitle}
          isDarkMode={false}
          onSubmit={() => {}}
          hasNetworksError={false}
          confirmDisabled
          isSubmitting={false}
          renderNameInput={() => null}
          renderAddressInput={() => null}
          renderNetworksInput={() => null}
        />
      </div>
    )
  },
}))

describe('AddContact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastProps = undefined
  })

  it('passes the trigger label, dialog title, and success copy', () => {
    render(<AddContact label="Add shared contact" />)

    expect(screen.getByRole('button', { name: 'Add shared contact' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Add contact' })).toBeInTheDocument()
    expect(lastProps?.successMessage).toBe('Contact added to Acme address book')
    expect(lastProps?.successGroupKey).toBe('add-contact-success')
  })

  it('defaults the trigger label and dialog title to "Add contact"', () => {
    render(<AddContact />)
    const dialog = screen.getByRole('dialog', { name: 'Add contact' })
    const triggers = screen.getAllByRole('button', { name: 'Add contact' }).filter((button) => !dialog.contains(button))
    expect(triggers).toHaveLength(1)
  })

  it('submit calls the shared-address-book mutation with the right payload', async () => {
    mockUpsertAddressBook.mockResolvedValue({})
    render(<AddContact />)

    await lastProps!.submit({ name: 'Alice', address: '0xabc', chainIds: ['1'] }, MOCK_SPACE_UUID)

    expect(mockUpsertAddressBook).toHaveBeenCalledWith({
      spaceId: MOCK_SPACE_UUID,
      upsertAddressBookItemsDto: { items: [{ name: 'Alice', address: '0xabc', chainIds: ['1'] }] },
    })
  })

  it('onSubmitStart tracks ADD_ADDRESS_SUBMIT', () => {
    render(<AddContact />)
    lastProps!.onSubmitStart!()

    expect(trackEvent).toHaveBeenCalledWith({ ...SPACE_EVENTS.ADD_ADDRESS_SUBMIT })
  })

  it('onSuccess tracks ADDRESS_BOOK_ENTRY_CREATED with the post-insert count', () => {
    render(<AddContact />)
    lastProps!.onSuccess!()

    expect(trackEvent).toHaveBeenCalledWith({ ...SPACE_EVENTS.ADDRESS_BOOK_ENTRY_CREATED }, { 'Entry Count': 3 })
  })

  it('renders without crashing when invoked', async () => {
    render(<AddContact />)
    await waitFor(() => expect(screen.getByTestId('dialog-stub')).toBeInTheDocument())
    fireEvent(screen.getByTestId('dialog-stub'), new Event('click'))
  })
})
