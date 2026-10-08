import { render, screen } from '@testing-library/react'
import AddLocalContact from '../AddLocalContact'
import { AddContactDialogView as MockAddContactDialogView } from '@views/features/spaces/components/SpaceAddressBook/AddContactDialogView'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'

const mockDispatch = jest.fn()

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

type CapturedProps = {
  triggerLabel?: string
  dialogTitle?: string
  intro?: React.ReactNode
  successMessage: string
  successGroupKey: string
  submit: (item: unknown, sid: string) => Promise<{ error?: unknown }>
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
          intro={props.intro}
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

describe('AddLocalContact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastProps = undefined
  })

  it('passes the local-contact trigger label, title, intro, and success copy', () => {
    render(<AddLocalContact />)

    const dialog = screen.getByRole('dialog', { name: 'Add contact' })
    const triggers = screen.getAllByRole('button', { name: 'Add contact' }).filter((button) => !dialog.contains(button))
    expect(triggers).toHaveLength(1)
    expect(dialog).toHaveTextContent(
      'This contact is stored locally in this browser. You can propose adding it to the shared Workspace address book later.',
    )
    expect(lastProps?.successMessage).toBe('Contact added')
    expect(lastProps?.successGroupKey).toBe('add-local-contact-success')
  })

  it('submit writes the contact to the local address book and never calls the server', async () => {
    render(<AddLocalContact />)

    const result = await lastProps!.submit({ name: 'Bob', address: '0xdef', chainIds: ['1', '137'] }, 'unused')

    expect(result).toEqual({})
    expect(mockDispatch).toHaveBeenCalledWith(
      upsertAddressBookEntries({ chainIds: ['1', '137'], address: '0xdef', name: 'Bob' }),
    )
  })
})
