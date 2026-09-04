import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { renderHook, waitFor } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import { useCloudCosignerInfo } from '../useCloudCosignerInfo'
import { useIsCloudCosigner } from '../useIsCloudCosigner'

const SERVICE_URL = 'https://cosigner.test'

jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  CLOUD_COSIGNER_URL: 'https://cosigner.test',
}))

const cosignerAddress = checksumAddress(faker.finance.ethereumAddress())
const info = {
  address: cosignerAddress,
  defaultPolicy: { valueThresholdUsd: 100000, reviewUnknownContracts: true, instructions: null },
}

const server = setupServer(http.get(`${SERVICE_URL}/v1/cloud-cosigner`, () => HttpResponse.json(info)))

describe('useCloudCosignerInfo', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('is unavailable and requests nothing when the chain feature is off', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
    const requests = jest.fn()
    server.events.on('request:start', requests)

    const { result } = renderHook(() => useCloudCosignerInfo())

    expect(result.current).toEqual({
      isAvailable: false,
      address: undefined,
      defaultPolicy: undefined,
      isLoading: false,
      error: undefined,
    })
    expect(requests).not.toHaveBeenCalled()
  })

  it('loads the cosigner address when the feature is on', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useCloudCosignerInfo())

    expect(result.current.isAvailable).toBe(true)
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.address).toBe(cosignerAddress))
    expect(result.current.defaultPolicy).toEqual(info.defaultPolicy)
    expect(result.current.isLoading).toBe(false)
  })

  it('exposes a request error', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    server.use(http.get(`${SERVICE_URL}/v1/cloud-cosigner`, () => HttpResponse.json({}, { status: 503 })))

    const { result } = renderHook(() => useCloudCosignerInfo())

    await waitFor(() => expect(result.current.error).toBeDefined())
    expect(result.current.address).toBeUndefined()
  })

  it('identifies the cosigner address through useIsCloudCosigner', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => ({
      cosigner: useIsCloudCosigner(cosignerAddress.toLowerCase()),
      other: useIsCloudCosigner(checksumAddress(faker.finance.ethereumAddress())),
    }))

    await waitFor(() => expect(result.current.cosigner).toBe(true))
    expect(result.current.other).toBe(false)
  })
})
