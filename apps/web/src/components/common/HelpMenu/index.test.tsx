import { fireEvent, render, screen } from '@testing-library/react'
import HelpMenu from './index'

let mockDisabled = false
let mockOfficial = true
const mockSupport = jest.fn()
jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({
    $isDisabled: mockDisabled,
    WorkspaceSupportChat: (props: { open: boolean; onClose: () => void }) => {
      mockSupport(props)
      return props.open ? <button onClick={props.onClose}>Close test support</button> : null
    },
  }),
}))
jest.mock('@/features/support-chat', () => ({ SupportChatFeature: 'support-chat', useSupportEligibility: () => false }))
jest.mock('@/hooks/useIsOfficialHost', () => ({ useIsOfficialHost: () => mockOfficial }))

describe('HelpMenu', () => {
  let anchor: HTMLButtonElement
  beforeEach(() => {
    mockDisabled = false
    mockOfficial = true
    jest.clearAllMocks()
    anchor = document.createElement('button')
    document.body.append(anchor)
  })
  afterEach(() => anchor.remove())

  it('opens the Workspace support component and closes the menu', () => {
    const onClose = jest.fn()
    render(<HelpMenu anchorEl={anchor} onClose={onClose} />)
    fireEvent.click(screen.getByText('Contact support'))
    expect(onClose).toHaveBeenCalled()
    expect(mockSupport).toHaveBeenLastCalledWith(expect.objectContaining({ open: true }))
    fireEvent.click(screen.getByText('Close test support'))
    expect(mockSupport).toHaveBeenLastCalledWith(expect.objectContaining({ open: false }))
  })

  it.each(['disabled', 'unofficial'])('keeps documentation available when support is %s', (state) => {
    mockDisabled = state === 'disabled'
    mockOfficial = state !== 'unofficial'
    const open = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(<HelpMenu anchorEl={anchor} onClose={jest.fn()} />)
    expect(screen.queryByText('Contact support')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Help center'))
    expect(open).toHaveBeenCalledWith('https://help.safe.global', '_blank', 'noopener,noreferrer')
    open.mockRestore()
  })

  it('removes open support when the Config Service flag becomes disabled', () => {
    const { rerender } = render(<HelpMenu anchorEl={anchor} onClose={jest.fn()} />)
    fireEvent.click(screen.getByText('Contact support'))
    expect(screen.getByText('Close test support')).toBeInTheDocument()
    mockDisabled = true
    rerender(<HelpMenu anchorEl={anchor} onClose={jest.fn()} />)
    expect(screen.queryByText('Close test support')).not.toBeInTheDocument()
    expect(screen.queryByText('Contact support')).not.toBeInTheDocument()
    expect(screen.getByText('Help center')).toBeInTheDocument()
  })
})
