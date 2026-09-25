import { renderHook, act } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import { _resetCheckoutDeadlines, useCheckoutReturn } from '../useCheckoutReturn'

const mockReplace = jest.fn()
let mockQuery: Record<string, string> = {}
jest.mock('next/router', () => ({
  useRouter: () => ({ query: mockQuery, pathname: '/spaces', replace: mockReplace }),
}))

const mockSessionQuery = jest.fn()
const mockSubscriptionsQuery = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/billing', () => ({
  useBillingGetCheckoutSessionV1Query: (...args: unknown[]) => mockSessionQuery(...args),
  useBillingGetSubscriptionsV1Query: (...args: unknown[]) => mockSubscriptionsQuery(...args),
}))
let mockGatedSpaceId: string | null = null
jest.mock('../useBillingSpaceId', () => ({ useBillingSpaceId: () => mockGatedSpaceId }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const polling = (interval: number) => expect.objectContaining({ pollingInterval: interval })
const active = (subscriptionStatus: string) => ({
  data: [{ id: 'sub_1', status: subscriptionStatus, plan: { name: 'Business' } }],
})
const session = (paymentStatus: string) => ({ data: { id: 'cs_1', paymentStatus }, isError: false })

describe('useCheckoutReturn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    _resetCheckoutDeadlines()
    mockGatedSpaceId = SPACE_ID
    mockQuery = { spaceId: SPACE_ID, sessionId: 'cs_1' }
    mockSessionQuery.mockReturnValue({ data: undefined, isError: false })
    mockSubscriptionsQuery.mockReturnValue({ data: undefined })
  })

  it('is idle without a session id and skips both queries', () => {
    mockQuery = { spaceId: SPACE_ID }
    const { result } = renderHook(() => useCheckoutReturn())

    expect(result.current).toMatchObject({ isReturning: false, status: 'idle' })
    expect(mockSessionQuery).toHaveBeenCalledWith(skipToken, expect.anything())
    expect(mockSubscriptionsQuery).toHaveBeenCalledWith(skipToken, expect.anything())
  })

  it('reports processing until the session settles, then activating until the subscription lands', () => {
    mockSessionQuery.mockReturnValue(session('unpaid'))
    const { result, rerender } = renderHook(() => useCheckoutReturn())
    expect(result.current.status).toBe('processing')
    expect(mockSubscriptionsQuery).toHaveBeenLastCalledWith(skipToken, expect.anything())

    mockSessionQuery.mockReturnValue(session('no_payment_required'))
    rerender()
    expect(result.current.status).toBe('activating')
    expect(mockSubscriptionsQuery).toHaveBeenLastCalledWith({ spaceId: SPACE_ID }, expect.anything())

    mockSubscriptionsQuery.mockReturnValue({ data: [{ id: 'sub_1', status: 'trialing', plan: { name: 'Business' } }] })
    rerender()
    expect(result.current.status).toBe('complete')
    expect(result.current.subscription?.id).toBe('sub_1')
  })

  it('treats a paid session the same as a free one', () => {
    mockSessionQuery.mockReturnValue(session('paid'))
    mockSubscriptionsQuery.mockReturnValue({ data: [{ id: 'sub_1', status: 'active', plan: { name: 'Business' } }] })
    expect(renderHook(() => useCheckoutReturn()).result.current.status).toBe('complete')
  })

  it('times out when the subscription never propagates', () => {
    jest.useFakeTimers()
    mockSessionQuery.mockReturnValue(session('paid'))
    const { result } = renderHook(() => useCheckoutReturn())

    act(() => jest.advanceTimersByTime(60_000))

    expect(result.current.status).toBe('timeout')

    act(() => result.current.retry())
    expect(result.current.status).toBe('activating')
    act(() => jest.advanceTimersByTime(59_000))
    expect(result.current.status).toBe('activating')
    act(() => jest.advanceTimersByTime(1_000))
    expect(result.current.status).toBe('timeout')
    jest.useRealTimers()
  })

  it('surfaces a session error', () => {
    mockSessionQuery.mockReturnValue({ data: undefined, isError: true })
    expect(renderHook(() => useCheckoutReturn()).result.current.status).toBe('error')
  })

  it('drops only the session id from the URL on dismiss', () => {
    renderHook(() => useCheckoutReturn()).result.current.dismiss()

    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: SPACE_ID } }, undefined, {
      shallow: true,
    })
  })

  it('ignores a session id while billing is off, so nothing is fetched or shown', () => {
    mockGatedSpaceId = null
    const { result } = renderHook(() => useCheckoutReturn())

    expect(result.current).toMatchObject({ isReturning: false, status: 'idle' })
    expect(mockSessionQuery).toHaveBeenCalledWith(skipToken, expect.anything())
  })

  it('stops polling the session once it settles', () => {
    const { rerender } = renderHook(() => useCheckoutReturn())
    expect(mockSessionQuery).toHaveBeenLastCalledWith({ sessionId: 'cs_1' }, polling(3_000))

    mockSessionQuery.mockReturnValue(session('paid'))
    rerender()
    expect(mockSessionQuery).toHaveBeenLastCalledWith({ sessionId: 'cs_1' }, polling(0))
  })

  it('stops polling a failed session', () => {
    mockSessionQuery.mockReturnValue({ data: undefined, isError: true })
    renderHook(() => useCheckoutReturn())

    expect(mockSessionQuery).toHaveBeenLastCalledWith({ sessionId: 'cs_1' }, polling(0))
  })

  it('stops polling the subscriptions once the plan is live', () => {
    mockSessionQuery.mockReturnValue(session('paid'))
    const { rerender } = renderHook(() => useCheckoutReturn())
    expect(mockSubscriptionsQuery).toHaveBeenLastCalledWith({ spaceId: SPACE_ID }, polling(3_000))

    mockSubscriptionsQuery.mockReturnValue(active('active'))
    rerender()
    expect(mockSubscriptionsQuery).toHaveBeenLastCalledWith({ spaceId: SPACE_ID }, polling(0))
  })

  it('stops polling on timeout and resumes on retry', () => {
    jest.useFakeTimers()
    mockSessionQuery.mockReturnValue(session('paid'))
    const { result } = renderHook(() => useCheckoutReturn())

    act(() => jest.advanceTimersByTime(60_000))
    expect(mockSubscriptionsQuery).toHaveBeenLastCalledWith({ spaceId: SPACE_ID }, polling(0))

    act(() => result.current.retry())
    expect(mockSubscriptionsQuery).toHaveBeenLastCalledWith({ spaceId: SPACE_ID }, polling(3_000))
    jest.useRealTimers()
  })

  it('shares the deadline between instances, so they time out and retry together', () => {
    jest.useFakeTimers()
    mockSessionQuery.mockReturnValue(session('paid'))
    const first = renderHook(() => useCheckoutReturn())
    act(() => jest.advanceTimersByTime(30_000))
    const second = renderHook(() => useCheckoutReturn())

    act(() => jest.advanceTimersByTime(30_000))
    expect(first.result.current.status).toBe('timeout')
    expect(second.result.current.status).toBe('timeout')

    act(() => second.result.current.retry())
    expect(first.result.current.status).toBe('activating')
    expect(second.result.current.status).toBe('activating')
    jest.useRealTimers()
  })
})
