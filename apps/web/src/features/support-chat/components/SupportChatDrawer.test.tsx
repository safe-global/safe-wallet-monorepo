import { act, fireEvent, render, screen } from '@testing-library/react'
import SupportChatDrawer from './SupportChatDrawer'

const props = {
  open: true,
  onClose: jest.fn(),
  config: { appId: 'test-app', chatUrl: 'https://support.test/chat', aliasDomain: '', allowedParents: [] },
  user: { email: 'test@example.com', name: 'Test user', jwt: 'test-token' },
}

function sendMessage(type: string, origin = 'https://support.test') {
  const iframe = screen.getByTitle('Safe Support Chat') as HTMLIFrameElement
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { origin, source: iframe.contentWindow, data: { type } }))
  })
}

describe('SupportChatDrawer connection recovery', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })
  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('replaces a stuck loader with retry, documentation and close actions', () => {
    render(<SupportChatDrawer {...props} />)
    expect(screen.getByText('Launching support chat…')).toBeInTheDocument()
    act(() => jest.advanceTimersByTime(20_000))
    expect(screen.queryByText('Launching support chat…')).not.toBeInTheDocument()
    expect(screen.getByText('Support chat is unavailable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Help center' })).toHaveAttribute('href', 'https://help.safe.global')
    fireEvent.click(screen.getByRole('button', { name: 'Close support' }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('does not reset the connection deadline when configuration is requested', () => {
    render(<SupportChatDrawer {...props} />)
    act(() => jest.advanceTimersByTime(10_000))
    sendMessage('pylon-request-config')
    act(() => jest.advanceTimersByTime(10_000))
    expect(screen.getByText('Support chat is unavailable')).toBeInTheDocument()
  })

  it('does not let a late iframe load event erase the connection error', () => {
    render(<SupportChatDrawer {...props} />)
    act(() => jest.advanceTimersByTime(20_000))
    fireEvent.load(screen.getByTitle('Safe Support Chat'))
    expect(screen.getByText('Support chat is unavailable')).toBeInTheDocument()
  })

  it('retries with a fresh iframe and accepts its ready event', () => {
    render(<SupportChatDrawer {...props} />)
    const previousFrame = screen.getByTitle('Safe Support Chat')
    act(() => jest.advanceTimersByTime(20_000))
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByTitle('Safe Support Chat')).not.toBe(previousFrame)
    expect(screen.getByText('Launching support chat…')).toBeInTheDocument()
    sendMessage('pylon-chat-ready')
    act(() => jest.advanceTimersByTime(30_000))
    expect(screen.queryByText('Launching support chat…')).not.toBeInTheDocument()
    expect(screen.queryByText('Support chat is unavailable')).not.toBeInTheDocument()
  })

  it('rejects a ready event from the wrong origin', () => {
    render(<SupportChatDrawer {...props} />)
    sendMessage('pylon-chat-ready', 'https://other.test')
    act(() => jest.advanceTimersByTime(20_000))
    expect(screen.getByText('Support chat is unavailable')).toBeInTheDocument()
  })

  it('starts a new connection attempt when reopened after a failure', () => {
    const { rerender } = render(<SupportChatDrawer {...props} />)
    act(() => jest.advanceTimersByTime(20_000))
    rerender(<SupportChatDrawer {...props} open={false} />)
    rerender(<SupportChatDrawer {...props} />)
    expect(screen.getByText('Launching support chat…')).toBeInTheDocument()
    expect(screen.queryByText('Support chat is unavailable')).not.toBeInTheDocument()
  })
})
