import { renderHook } from '@testing-library/react'
import * as spacesRTK from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useWorkspaceAddressBookLabel } from '../useWorkspaceAddressBookLabel'

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => 'space-1',
}))

jest.mock('@/store', () => ({
  useAppSelector: () => true,
}))

const spaceQuerySpy = jest.spyOn(spacesRTK, 'useSpacesGetOneV1Query')

describe('useWorkspaceAddressBookLabel', () => {
  afterAll(() => {
    spaceQuerySpy.mockRestore()
  })

  it('uses the space name when available', () => {
    spaceQuerySpy.mockReturnValue({ currentData: { name: 'Acme' } } as unknown as ReturnType<
      typeof spacesRTK.useSpacesGetOneV1Query
    >)

    const { result } = renderHook(() => useWorkspaceAddressBookLabel())

    expect(result.current).toBe('Acme address book')
  })

  it('falls back to a name-agnostic label when the name is not yet loaded', () => {
    spaceQuerySpy.mockReturnValue({ currentData: undefined } as unknown as ReturnType<
      typeof spacesRTK.useSpacesGetOneV1Query
    >)

    const { result } = renderHook(() => useWorkspaceAddressBookLabel())

    expect(result.current).toBe('the workspace address book')
  })
})
