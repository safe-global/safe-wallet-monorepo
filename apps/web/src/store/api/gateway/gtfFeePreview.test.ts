import { configureStore } from '@reduxjs/toolkit'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'

import { GATEWAY_URL } from '@/config/gateway'
import { gatewayApi } from './index'

const SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'
const SAFE_TX_HASH = `0x${'ab'.repeat(32)}`

const SNAPSHOT_BODY = {
  txData: {
    chainId: '1',
    safeAddress: SAFE_ADDRESS,
    safeTxGas: '2409',
    baseGas: '68568',
    gasPrice: '741064438',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0xc918e75504D1B0c741Eb4236B72Dae7A52401E95',
    numberSignatures: 2,
  },
  feeBreakdown: { relayCostUsd: 0.12, totalUsd: 1.12, safenetFeeUsd: 1 },
  maxFeeCapUsd: 2,
}

const SNAPSHOT_ROUTE = `${GATEWAY_URL}/v1/chains/:chainId/fees/:safeAddress/preview/:safeTxHash`

const makeApiStore = () =>
  configureStore({
    reducer: { [gatewayApi.reducerPath]: gatewayApi.reducer },
    // The app store does the same: `fakeBaseQuery<Error>` parks Error instances in state.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(gatewayApi.middleware),
  })

const fetchSnapshot = () =>
  makeApiStore().dispatch(
    gatewayApi.endpoints.getGtfFeeSnapshot.initiate({
      chainId: '1',
      safeAddress: SAFE_ADDRESS,
      safeTxHash: SAFE_TX_HASH,
    }),
  )

describe('getGtfFeeSnapshot', () => {
  it('GETs the stored quote for the signed safeTxHash', async () => {
    let requestedUrl = ''
    let method = ''
    server.use(
      http.get(SNAPSHOT_ROUTE, ({ request }) => {
        requestedUrl = request.url
        method = request.method
        return HttpResponse.json(SNAPSHOT_BODY)
      }),
    )

    const result = await fetchSnapshot()

    expect(method).toBe('GET')
    expect(requestedUrl).toBe(`${GATEWAY_URL}/v1/chains/1/fees/${SAFE_ADDRESS}/preview/${SAFE_TX_HASH}`)
    expect(result.data).toEqual(SNAPSHOT_BODY)
  })

  it('errors when no quote is stored for the hash (404)', async () => {
    server.use(http.get(SNAPSHOT_ROUTE, () => HttpResponse.json({ message: 'not found' }, { status: 404 })))

    const result = await fetchSnapshot()

    expect(result.data).toBeUndefined()
    expect((result.error as Error).message).toBe('Fee snapshot failed with status 404')
  })

  it('errors on a body that carries neither fee arm', async () => {
    server.use(http.get(SNAPSHOT_ROUTE, () => HttpResponse.json({ txData: SNAPSHOT_BODY.txData })))

    const result = await fetchSnapshot()

    expect(result.data).toBeUndefined()
    expect((result.error as Error).message).toBe('Fee snapshot response did not match expected shape')
  })
})
