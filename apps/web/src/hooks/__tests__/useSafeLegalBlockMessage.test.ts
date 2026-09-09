import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import { renderHook } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { CGW_SAFE_UNAVAILABLE } from '@safe-global/utils/services/exceptions/gatewayErrors'
import useSafeLegalBlockMessage from '../useSafeLegalBlockMessage'

const CHAIN_ID = '1'
const SAFE_ADDRESS = '0x87a57cBf742CC1Fc702D0E9BF595b1E056693e2f'

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => CHAIN_ID,
}))

jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeAddressFromUrl: () => SAFE_ADDRESS,
}))

const mockSafeResponse = (response: HttpResponse) => {
  server.use(http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () => response))
}

// Also surfaces the query status so the negative cases assert on a settled request
// rather than on the undefined the hook returns while still loading.
const useSettledMessage = () => {
  const { isSuccess, isError } = useSafesGetSafeV1Query({ chainId: CHAIN_ID, safeAddress: SAFE_ADDRESS })
  return { message: useSafeLegalBlockMessage(), settled: isSuccess || isError }
}

describe('useSafeLegalBlockMessage', () => {
  it('returns the agreed copy, not the backend reason, when the Safe is blocked for legal reasons', async () => {
    mockSafeResponse(
      HttpResponse.json({ code: 451, message: 'Blocked in your region by provider edge-node-7' }, { status: 451 }),
    )

    const { result } = renderHook(() => useSafeLegalBlockMessage())

    await waitFor(() => expect(result.current).toBe(CGW_SAFE_UNAVAILABLE))
  })

  it('returns the same copy when the 451 carries no message', async () => {
    mockSafeResponse(HttpResponse.json({}, { status: 451 }))

    const { result } = renderHook(() => useSafeLegalBlockMessage())

    await waitFor(() => expect(result.current).toBe(CGW_SAFE_UNAVAILABLE))
  })

  it('returns undefined for other errors', async () => {
    mockSafeResponse(HttpResponse.json({ code: 404, message: 'Safe not found' }, { status: 404 }))

    const { result } = renderHook(() => useSettledMessage())

    await waitFor(() => expect(result.current.settled).toBe(true))
    expect(result.current.message).toBeUndefined()
  })

  it('returns undefined when the Safe loads', async () => {
    mockSafeResponse(HttpResponse.json({ address: { value: SAFE_ADDRESS }, chainId: CHAIN_ID }))

    const { result } = renderHook(() => useSettledMessage())

    await waitFor(() => expect(result.current.settled).toBe(true))
    expect(result.current.message).toBeUndefined()
  })
})
