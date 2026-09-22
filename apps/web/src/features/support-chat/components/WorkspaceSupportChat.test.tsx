import { render } from '@testing-library/react'
import type { UserSession } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import WorkspaceSupportChat from './WorkspaceSupportChat'
import type { AuthenticatedSupportChatProps } from './AuthenticatedSupportChat'

let mockSignedIn = true
let mockSession: UserSession | undefined
let mockFetching = false
let mockError = false
const mockSupport = jest.fn()
const mockSessionQuery = jest.fn()

jest.mock('@/store', () => ({ useAppSelector: () => mockSignedIn }))
jest.mock('@/store/authSlice', () => ({ isAuthenticated: jest.fn() }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  useAuthGetMeV1Query: (...args: unknown[]) => {
    mockSessionQuery(...args)
    return { currentData: mockSession, isFetching: mockFetching, isError: mockError }
  },
}))
jest.mock('./AuthenticatedSupportChat', () => ({
  __esModule: true,
  default: (props: AuthenticatedSupportChatProps) => {
    mockSupport(props)
    return null
  },
}))

describe('WorkspaceSupportChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignedIn = true
    mockFetching = false
    mockError = false
    mockSession = { id: '123', email: 'support-test@example.com', authMethod: 'oidc' }
  })

  it('uses the authenticated Workspace user ID for support', () => {
    const onClose = jest.fn()
    render(<WorkspaceSupportChat open onClose={onClose} />)
    expect(mockSupport).toHaveBeenLastCalledWith(
      expect.objectContaining({ identityKey: 'oidc:123', open: true, onClose }),
    )
  })

  it('drops the support identity immediately on logout even with a cached session', () => {
    const { rerender } = render(<WorkspaceSupportChat open onClose={jest.fn()} />)
    mockSignedIn = false
    rerender(<WorkspaceSupportChat open onClose={jest.fn()} />)
    expect(mockSupport).toHaveBeenLastCalledWith(expect.objectContaining({ identityKey: undefined }))
    expect(mockSessionQuery).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ skip: true }))
  })

  it.each(['error', 'siwe', 'missing'])('withholds identity for %s sessions', (state) => {
    mockFetching = state === 'fetching'
    mockError = state === 'error'
    if (state === 'siwe') mockSession = { id: '123', authMethod: 'siwe' }
    if (state === 'missing') mockSession = undefined
    render(<WorkspaceSupportChat open onClose={jest.fn()} />)
    expect(mockSupport).toHaveBeenLastCalledWith(expect.objectContaining({ identityKey: undefined }))
  })

  it('changes identity when the signed-in Workspace user changes', () => {
    const { rerender } = render(<WorkspaceSupportChat open onClose={jest.fn()} />)
    mockSession = { id: '456', authMethod: 'oidc' }
    rerender(<WorkspaceSupportChat open onClose={jest.fn()} />)
    expect(mockSupport).toHaveBeenLastCalledWith(expect.objectContaining({ identityKey: 'oidc:456' }))
  })

  it('skips session reads while the support panel is closed', () => {
    render(<WorkspaceSupportChat open={false} onClose={jest.fn()} />)
    expect(mockSessionQuery).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ skip: true }))
  })
  it('accepts a verified SIWE signer and preserves identity during background refresh', () => {
    mockSession = { id: '123', authMethod: 'siwe', signerAddress: '0xABC' }
    const { rerender } = render(<WorkspaceSupportChat open onClose={jest.fn()} />)
    expect(mockSupport).toHaveBeenLastCalledWith(expect.objectContaining({ identityKey: 'siwe:123:0xabc' }))
    mockFetching = true
    rerender(<WorkspaceSupportChat open onClose={jest.fn()} />)
    expect(mockSupport).toHaveBeenLastCalledWith(expect.objectContaining({ identityKey: 'siwe:123:0xabc' }))
    mockSession = { ...mockSession, signerAddress: '0xDEF' }
    rerender(<WorkspaceSupportChat open onClose={jest.fn()} />)
    expect(mockSupport).toHaveBeenLastCalledWith(expect.objectContaining({ identityKey: 'siwe:123:0xdef' }))
    mockSession = { id: '123', authMethod: 'oidc' }
    rerender(<WorkspaceSupportChat open onClose={jest.fn()} />)
    expect(mockSupport).toHaveBeenLastCalledWith(expect.objectContaining({ identityKey: 'oidc:123' }))
  })
})
