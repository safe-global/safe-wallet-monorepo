import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { FEE_COLLECTORS } from '@/features/pay-from-safe/constants'
import { useGetPayFromSafeFeePreviewQuery } from '../index'

const SAFE = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const PREVIEW_URL = `${GATEWAY_URL}/v1/chains/11155111/fees/${SAFE}/preview`

const arg = {
  chainId: '11155111',
  safeAddress: SAFE,
  tx: { to: SAFE, value: '0', data: '0x', operation: 0, gasToken: ZERO_ADDRESS, numberSignatures: 1, nonce: 1 },
}

const quote = (refundReceiver: string) => ({
  txData: {
    chainId: '11155111',
    safeAddress: SAFE,
    safeTxGas: '12983',
    baseGas: '72094',
    gasPrice: '1000000000',
    gasToken: ZERO_ADDRESS,
    refundReceiver,
    numberSignatures: 1,
  },
  relayCost: { fiatCode: 'USD', fiatValue: '0.2' },
})

describe('getPayFromSafeFeePreview', () => {
  it('returns the quote when the refund receiver is a fee collector', async () => {
    server.use(http.post(PREVIEW_URL, () => HttpResponse.json(quote(FEE_COLLECTORS[0]))))

    const { result } = renderHook(() => useGetPayFromSafeFeePreviewQuery(arg))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.txData.refundReceiver).toBe(FEE_COLLECTORS[0])
  })

  it('treats a quote with an untrusted refund receiver as an error, not a free quote', async () => {
    // The CGW answers an empty quote for payloads it does not relay for a fee (e.g. approveHash on another Safe)
    server.use(http.post(PREVIEW_URL, () => HttpResponse.json(quote(ZERO_ADDRESS))))

    const { result } = renderHook(() => useGetPayFromSafeFeePreviewQuery(arg))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('reports a failed request as an error', async () => {
    server.use(http.post(PREVIEW_URL, () => HttpResponse.json({ message: 'nope' }, { status: 422 })))

    const { result } = renderHook(() => useGetPayFromSafeFeePreviewQuery(arg))

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
