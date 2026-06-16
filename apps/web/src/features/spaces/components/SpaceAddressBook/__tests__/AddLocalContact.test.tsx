import { render, screen } from '@testing-library/react'
import AddLocalContact from '../AddLocalContact'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'

const mockDispatch = jest.fn()

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

type CapturedProps = {
  triggerLabel: string
  dialogTitle: string
  intro?: React.ReactNode
  successMessage: string
  successGroupKey: string
  submit: (item: unknown, sid: string) => Promise<{ error?: unknown }>
}

let lastProps: CapturedProps | undefined

jest.mock('../AddContactDialog', () => ({
  __esModule: true,
  default: (props: CapturedProps) => {
    lastProps = props
    return <div data-testid="dialog-stub">{props.triggerLabel}</div>
  },
}))

describe('AddLocalContact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastProps = undefined
  })

  it('passes the local-contact trigger label, title, intro, and success copy', () => {
    render(<AddLocalContact />)

    expect(lastProps?.triggerLabel).toBe('Add contact')
    expect(lastProps?.dialogTitle).toBe('Add contact')
    expect(lastProps?.intro).toBe(
      'This contact is stored locally in this browser. You can propose adding it to the shared workspace address book later.',
    )
    expect(lastProps?.successMessage).toBe('Contact added')
    expect(lastProps?.successGroupKey).toBe('add-local-contact-success')
    expect(screen.getByTestId('dialog-stub')).toHaveTextContent('Add contact')
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
