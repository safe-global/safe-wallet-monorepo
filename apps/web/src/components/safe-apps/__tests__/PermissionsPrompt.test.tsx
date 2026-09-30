import { render, screen, fireEvent } from '@/tests/test-utils'
import PermissionsPrompt from '@/components/safe-apps/PermissionsPrompt'

const requestId = 'abc1234567'

const setup = () => {
  const onReject = jest.fn()
  const onAccept = jest.fn()

  render(
    <PermissionsPrompt
      isOpen
      origin="https://app.url"
      requestId={requestId}
      permissions={[{ requestAddressBook: {} }]}
      onReject={onReject}
      onAccept={onAccept}
    />,
  )

  return { onReject, onAccept }
}

describe('PermissionsPrompt', () => {
  it('passes the requestId when Reject is pressed', () => {
    const { onReject } = setup()

    fireEvent.click(screen.getByText('Reject'))

    expect(onReject).toHaveBeenCalledWith(requestId)
  })

  it('passes no requestId when the prompt is closed with the X', () => {
    const { onReject } = setup()

    fireEvent.click(screen.getByTestId('modal-dialog-close-btn'))

    // AppFrame tells the two apart by whether an id was passed: Reject persists a denial, closing only
    // dismisses. Making this pass the id would silently turn a dismissal into a stored denial, which the
    // SDK's permission check cannot see — the app would stop asking and get an empty address book forever.
    expect(onReject).toHaveBeenCalledWith()
  })

  it('passes the origin and requestId when Accept is pressed', () => {
    const { onAccept } = setup()

    fireEvent.click(screen.getByText('Accept'))

    expect(onAccept).toHaveBeenCalledWith('https://app.url', requestId)
  })
})
