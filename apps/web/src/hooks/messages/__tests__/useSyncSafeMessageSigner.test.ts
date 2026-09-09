import { http, HttpResponse } from 'msw'

import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore, setStoreInstance } from '@/store'
import { fetchSafeMessage } from '../useSyncSafeMessageSigner'
import { getCgwErrorInfo } from '@/utils/cgw-errors'
import { CGW_ERROR_FALLBACK } from '@safe-global/utils/services/exceptions/gatewayErrors'

describe('fetchSafeMessage', () => {
  beforeEach(() => {
    setStoreInstance(makeStore(undefined, { skipBroadcast: true }))
  })

  const mockResponse = (status: number) =>
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () =>
        HttpResponse.json({ message: 'Example error' }, { status }),
      ),
    )

  it('preserves the CGW status so the failure can be classified', async () => {
    mockResponse(502)

    await expect(fetchSafeMessage('0x0123', '5')).rejects.toMatchObject({ status: 502 })
  })

  it('resolves to the agreed copy instead of a stringified error object', async () => {
    mockResponse(502)

    let thrown: Error | undefined
    try {
      await fetchSafeMessage('0x0123', '5')
    } catch (error) {
      thrown = error as Error
    }

    expect(getCgwErrorInfo(thrown)?.message).toBe(CGW_ERROR_FALLBACK)
    expect(thrown?.message).not.toContain('[object Object]')
  })
})
