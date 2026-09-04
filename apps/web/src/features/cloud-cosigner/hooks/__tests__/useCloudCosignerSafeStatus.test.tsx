import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { renderHook, waitFor } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { useCloudCosignerSafeStatus } from '../useCloudCosignerSafeStatus'

const SERVICE_URL = 'https://cosigner.test'

jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  CLOUD_COSIGNER_URL: 'https://cosigner.test',
}))

jest.mock('@/hooks/useSafeInfo')

const safeAddress = checksumAddress(faker.finance.ethereumAddress())
const status = {
  cosignerAddress: checksumAddress(faker.finance.ethereumAddress()),
  isEnabled: true,
  policy: { valueThresholdUsd: 50000, reviewUnknownContracts: false, instructions: 'Vendors only.' },
  isDefaultPolicy: false,
}

const server = setupServer(
  http.get(`${SERVICE_URL}/v1/chains/1/safes/${safeAddress}/cloud-cosigner`, () => HttpResponse.json(status)),
)

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>

describe('useCloudCosignerSafeStatus', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeEach(() => {
    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ chainId: '1', address: { value: safeAddress } })
        .build(),
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })
  })

  it('loads the status of the current Safe', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useCloudCosignerSafeStatus())

    expect(result.current.isAvailable).toBe(true)
    await waitFor(() => expect(result.current.status).toEqual(status))
    expect(result.current.isLoading).toBe(false)
  })

  it('does not query before the Safe is loaded', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder().with({ chainId: '1' }).build(),
      safeAddress: '',
      safeLoaded: false,
      safeLoading: true,
    })

    const { result } = renderHook(() => useCloudCosignerSafeStatus())

    expect(result.current.status).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('is unavailable when the feature is off', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

    const { result } = renderHook(() => useCloudCosignerSafeStatus())

    expect(result.current.isAvailable).toBe(false)
    expect(result.current.status).toBeUndefined()
  })
})
