import { renderHook } from '@testing-library/react'
import useGetSpaceAuditLog from '../useGetSpaceAuditLog'
import useGetSpaceAuditLogActors from '../useGetSpaceAuditLogActors'
import { useCurrentSpaceId } from '../useCurrentSpaceId'
import { useAppSelector } from '@/store'
import {
  useSpaceAuditGetAuditLogV1Query,
  useSpaceAuditGetAuditLogActorsV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

jest.mock('@/store', () => ({
  useAppSelector: jest.fn(),
}))
jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceAuditGetAuditLogV1Query: jest.fn(() => ({})),
  useSpaceAuditGetAuditLogActorsV1Query: jest.fn(() => ({})),
}))

const mockUseAppSelector = useAppSelector as jest.MockedFunction<typeof useAppSelector>
const mockUseCurrentSpaceId = useCurrentSpaceId as jest.MockedFunction<typeof useCurrentSpaceId>
const mockAuditQuery = useSpaceAuditGetAuditLogV1Query as jest.Mock
const mockActorsQuery = useSpaceAuditGetAuditLogActorsV1Query as jest.Mock

describe('useGetSpaceAuditLog / useGetSpaceAuditLogActors skip behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['not signed in', false, 'space-1', true],
    ['no current space', true, null, true],
    ['signed in with a space', true, 'space-1', false],
  ])('when %s, skip is %s', (_label, signedIn, spaceId, expectedSkip) => {
    mockUseAppSelector.mockReturnValue(signedIn)
    mockUseCurrentSpaceId.mockReturnValue(spaceId)

    renderHook(() => useGetSpaceAuditLog())
    renderHook(() => useGetSpaceAuditLogActors())

    expect(mockAuditQuery).toHaveBeenCalledWith(expect.anything(), { skip: expectedSkip })
    expect(mockActorsQuery).toHaveBeenCalledWith(expect.anything(), { skip: expectedSkip })
  })

  it('joins event types into the single comma-separated event_type param', () => {
    mockUseAppSelector.mockReturnValue(true)
    mockUseCurrentSpaceId.mockReturnValue('space-1')

    renderHook(() => useGetSpaceAuditLog({ eventTypes: ['ADDRESS_BOOK_UPSERTED', 'ADDRESS_BOOK_DELETED'] }))

    expect(mockAuditQuery).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'ADDRESS_BOOK_UPSERTED,ADDRESS_BOOK_DELETED' }),
      expect.anything(),
    )
  })
})
