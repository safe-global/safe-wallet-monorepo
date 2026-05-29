import { render, screen } from '@testing-library/react'
import AddPrivateContact from '../AddPrivateContact'

const mockUpsertPrivate = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useUserAddressBookUpsertPrivateItemsV1Mutation: () => [mockUpsertPrivate],
}))

type CapturedProps = {
  triggerLabel: string
  dialogTitle: string
  intro?: React.ReactNode
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

describe('AddPrivateContact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastProps = undefined
  })

  it('passes the private-contact trigger label, title, intro, and success copy', () => {
    render(<AddPrivateContact />)

    expect(lastProps?.triggerLabel).toBe('Add private contact')
    expect(lastProps?.dialogTitle).toBe('Add private contact')
    expect(lastProps?.intro).toBe(
      'This contact will be visible only to you. You can request to add it to the shared workspace address book later.',
    )
    expect(lastProps?.successMessage).toBe('Private contact added')
    expect(lastProps?.successGroupKey).toBe('add-private-contact-success')
    expect(screen.getByTestId('dialog-stub')).toHaveTextContent('Add private contact')
  })

  it('does not wire analytics callbacks', () => {
    render(<AddPrivateContact />)

    expect(lastProps?.onSubmitStart).toBeUndefined()
    expect(lastProps?.onSuccess).toBeUndefined()
  })

  it('submit calls the private mutation with the right payload', async () => {
    mockUpsertPrivate.mockResolvedValue({})
    render(<AddPrivateContact />)

    await lastProps!.submit({ name: 'Bob', address: '0xdef', chainIds: ['137'] }, '42')

    expect(mockUpsertPrivate).toHaveBeenCalledWith({
      spaceId: 42,
      upsertAddressBookItemsDto: { items: [{ name: 'Bob', address: '0xdef', chainIds: ['137'] }] },
    })
  })
})
