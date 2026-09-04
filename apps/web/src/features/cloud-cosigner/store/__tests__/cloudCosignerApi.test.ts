import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { makeStore } from '@/store'
import { cloudCosignerApi } from '../cloudCosignerApi'

const SERVICE_URL = 'https://cosigner.test'

jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  CLOUD_COSIGNER_URL: 'https://cosigner.test',
}))

const safeAddress = checksumAddress(faker.finance.ethereumAddress())
const policy = { valueThresholdUsd: 100000, reviewUnknownContracts: true, instructions: null }

const server = setupServer()

describe('cloudCosignerApi', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('fetches the cosigner info from the service base URL', async () => {
    const address = checksumAddress(faker.finance.ethereumAddress())
    server.use(
      http.get(`${SERVICE_URL}/v1/cloud-cosigner`, () => HttpResponse.json({ address, defaultPolicy: policy })),
    )
    const store = makeStore(undefined, { skipBroadcast: true })

    const result = await store.dispatch(cloudCosignerApi.endpoints.getCloudCosignerInfo.initiate())

    expect(result.data).toEqual({ address, defaultPolicy: policy })
  })

  it('sends the signed policy as a PUT and refreshes the Safe status', async () => {
    let statusRequests = 0
    let receivedBody: unknown
    server.use(
      http.get(`${SERVICE_URL}/v1/chains/1/safes/${safeAddress}/cloud-cosigner`, () => {
        statusRequests += 1
        return HttpResponse.json({
          cosignerAddress: safeAddress,
          isEnabled: true,
          policy,
          isDefaultPolicy: statusRequests === 1,
        })
      }),
      http.put(`${SERVICE_URL}/v1/chains/1/safes/${safeAddress}/cloud-cosigner/policy`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json(policy)
      }),
    )
    const store = makeStore(undefined, { skipBroadcast: true })
    const statusArgs = { chainId: '1', safeAddress }
    const subscription = store.dispatch(cloudCosignerApi.endpoints.getSafeCloudCosignerStatus.initiate(statusArgs))
    await subscription
    expect(statusRequests).toBe(1)

    const update = {
      chainId: '1',
      safeAddress,
      policy,
      signer: safeAddress,
      signature: '0xsig',
      issuedAt: '2026-09-04T10:00:00.000Z',
    }
    const result = await store.dispatch(cloudCosignerApi.endpoints.updateCloudCosignerPolicy.initiate(update))

    expect('data' in result && result.data).toEqual(policy)
    expect(receivedBody).toEqual({ policy, signer: safeAddress, signature: '0xsig', issuedAt: update.issuedAt })
    // The mutation invalidates the status tag, so the subscribed status query refetches.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(statusRequests).toBe(2)
    subscription.unsubscribe()
  })

  it('surfaces a 404 for a missing review', async () => {
    server.use(
      http.get(`${SERVICE_URL}/v1/chains/1/safes/${safeAddress}/cloud-cosigner/reviews/0xabc`, () =>
        HttpResponse.json({ message: 'Review not found' }, { status: 404 }),
      ),
    )
    const store = makeStore(undefined, { skipBroadcast: true })

    const result = await store.dispatch(
      cloudCosignerApi.endpoints.getCloudCosignerReview.initiate({ chainId: '1', safeAddress, safeTxHash: '0xabc' }),
    )

    expect(result.error).toMatchObject({ status: 404 })
  })
})
