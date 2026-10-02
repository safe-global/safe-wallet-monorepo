import { faker } from '@faker-js/faker'
import { renderHook } from '@/src/tests/test-utils'
import { useDelegateCleanup } from './useDelegateCleanup'
import { DelegateCleanupService } from '@/src/services/delegate-cleanup'
import { chainBuilder } from '@safe-global/utils/tests/builders/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { type Address } from '@/src/types/address'

const mockDeleteDelegateV2 = jest.fn()
const mockDeleteDelegateV3 = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  cgwApi: {
    useDelegatesDeleteDelegateV2Mutation: () => [mockDeleteDelegateV2],
    useDelegatesDeleteDelegateV3Mutation: () => [mockDeleteDelegateV3],
  },
}))

jest.mock('@/src/hooks/useNotificationCleanup', () => ({
  useNotificationCleanup: () => ({
    cleanupNotificationsForDelegate: jest.fn(),
  }),
}))

jest.mock('@/src/services/delegate-cleanup', () => ({
  ...jest.requireActual('@/src/services/delegate-cleanup'),
  DelegateCleanupService: jest.fn(),
}))

const mockDelegateCleanupService = jest.mocked(DelegateCleanupService)

const randomAddress = (): Address => `0x${faker.string.hexadecimal({ length: 40, prefix: '' })}`

const withoutQueueService = () =>
  faker.helpers.arrayElements(Object.values(FEATURES).filter((feature) => feature !== FEATURES.QUEUE_SERVICE))

const getDeleteDelegate = () => {
  renderHook(() => useDelegateCleanup())
  return mockDelegateCleanupService.mock.calls[0][0].deleteDelegate
}

describe('useDelegateCleanup', () => {
  const deleteDelegateDto = { delegator: randomAddress(), signature: faker.string.hexadecimal({ length: 130 }) }

  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteDelegateV2.mockResolvedValue({})
    mockDeleteDelegateV3.mockResolvedValue({})
  })

  it('deletes via the v3 endpoint on chains with QUEUE_SERVICE', async () => {
    const chain = chainBuilder()
      .with({ features: [...withoutQueueService(), FEATURES.QUEUE_SERVICE] })
      .build()
    const delegateAddress = randomAddress()

    await getDeleteDelegate()(chain, delegateAddress, deleteDelegateDto)

    expect(mockDeleteDelegateV3).toHaveBeenCalledWith({
      chainId: chain.chainId,
      delegateAddress,
      deleteDelegateV3Dto: deleteDelegateDto,
    })
    expect(mockDeleteDelegateV2).not.toHaveBeenCalled()
  })

  it('deletes via the v2 endpoint on chains without QUEUE_SERVICE', async () => {
    const chain = chainBuilder().with({ features: withoutQueueService() }).build()
    const delegateAddress = randomAddress()

    await getDeleteDelegate()(chain, delegateAddress, deleteDelegateDto)

    expect(mockDeleteDelegateV2).toHaveBeenCalledWith({
      chainId: chain.chainId,
      delegateAddress,
      deleteDelegateV2Dto: deleteDelegateDto,
    })
    expect(mockDeleteDelegateV3).not.toHaveBeenCalled()
  })
})
