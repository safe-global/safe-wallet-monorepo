import { render } from '@testing-library/react'
import SecurityHub from '../index'

const useCurrentSpaceIdMock = jest.fn<string | null, []>()
jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => useCurrentSpaceIdMock(),
}))

// The header's Safe Shield logo picks a light/dark variant via useDarkMode (Redux-backed).
// These tests render SecurityHub without a store and only assert remount behaviour.
jest.mock('@/hooks/useDarkMode', () => ({ useDarkMode: () => false }))

// Stub the per-space body with a mount counter so we can assert it is remounted
// (fresh state) when the active space changes, rather than re-rendered in place.
const mountSpy = jest.fn()
jest.mock('../SecurityHubContent', () => {
  const React = jest.requireActual('react')
  const MockSecurityHubContent = () => {
    React.useEffect(() => {
      mountSpy()
    }, [])
    return React.createElement('div', { 'data-testid': 'security-hub-content' })
  }
  return { __esModule: true, default: MockSecurityHubContent }
})

describe('SecurityHub', () => {
  beforeEach(() => {
    useCurrentSpaceIdMock.mockReset()
    mountSpy.mockReset()
    useCurrentSpaceIdMock.mockReturnValue('space-1')
  })

  it('remounts the content when the active space changes', () => {
    const { rerender } = render(<SecurityHub />)
    expect(mountSpy).toHaveBeenCalledTimes(1)

    useCurrentSpaceIdMock.mockReturnValue('space-2')
    rerender(<SecurityHub />)

    // A fresh mount (not just a re-render) means the previous space's scan state
    // cannot leak into the new space.
    expect(mountSpy).toHaveBeenCalledTimes(2)
  })

  it('does not remount the content on re-renders within the same space', () => {
    const { rerender } = render(<SecurityHub />)
    expect(mountSpy).toHaveBeenCalledTimes(1)

    rerender(<SecurityHub />)
    rerender(<SecurityHub />)

    expect(mountSpy).toHaveBeenCalledTimes(1)
  })
})
