import { fireEvent, render, screen, mockClipboard } from '@/tests/test-utils'
import CopyAddressIconButton from '.'

const ADDRESS = '0xA98ABC1234567890123456789012345678932F8'

describe('CopyAddressIconButton', () => {
  let writeText: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    writeText = mockClipboard()
  })

  it('renders a copy button labelled with the address action', () => {
    render(<CopyAddressIconButton address={ADDRESS} />)
    expect(screen.getByRole('button', { name: 'Copy address' })).toBeInTheDocument()
  })

  it('copies the address to the clipboard on click', () => {
    render(<CopyAddressIconButton address={ADDRESS} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }))

    expect(writeText).toHaveBeenCalledWith(ADDRESS)
  })

  it.each(['Enter', ' '])('copies the address when activated via the keyboard (%s)', (key) => {
    render(<CopyAddressIconButton address={ADDRESS} />)

    fireEvent.keyDown(screen.getByRole('button', { name: 'Copy address' }), { key })

    expect(writeText).toHaveBeenCalledWith(ADDRESS)
  })

  it('does not trigger the surrounding link/click handler', () => {
    const onParentClick = jest.fn()

    render(
      <a href="/somewhere" onClick={onParentClick}>
        <CopyAddressIconButton address={ADDRESS} />
      </a>,
    )

    const event = fireEvent.click(screen.getByRole('button', { name: 'Copy address' }))

    // The click is consumed by the copy button (preventDefault + stopPropagation)
    expect(event).toBe(false)
    expect(onParentClick).not.toHaveBeenCalled()
    expect(writeText).toHaveBeenCalledWith(ADDRESS)
  })
})
