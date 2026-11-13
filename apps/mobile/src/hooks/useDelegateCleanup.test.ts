import { faker } from '@faker-js/faker'
import { renderHook } from '@/src/tests/test-utils'
import { useDelegateCleanup } from './useDelegateCleanup'
import { DelegateCleanupService } from '@/src/services/delegate-cleanup'
import { chainBuilder } from '@safe-global/utils/tests/builders/chains'
import { type Address } from '@/src/types/address'
import Logger from '@/src/utils/logger'

const mockDeleteDelegate = jest.fn()

jest.mock('@safe-global/utils/hooks/useDelegateMutations', () => ({
  useDelegateMutations: () => ({ deleteDelegate: mockDeleteDelegate }),
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

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: { warn: jest.fn() },
}))

const mockDelegateCleanupService = jest.mocked(DelegateCleanupService)

const randomAddress = (): Address => `0x${faker.string.hexadecimal({ length: 40, prefix: '' })}`

const getDeleteDelegate = () => {
  renderHook(() => useDelegateCleanup())
  return mockDelegateCleanupService.mock.calls[0][0].deleteDelegate
}

describe('useDelegateCleanup', () => {
  const deleteDelegateDto = { delegator: randomAddress(), signature: faker.string.hexadecimal({ length: 130 }) }

  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteDelegate.mockResolvedValue(undefined)
  })

  it('deletes the delegate through the shared delegate mutations', async () => {
    const chain = chainBuilder().build()
    const delegateAddress = randomAddress()

    await getDeleteDelegate()(chain, delegateAddress, deleteDelegateDto)

    expect(mockDeleteDelegate).toHaveBeenCalledWith({ chain, delegateAddress, deleteDelegateDto })
  })

  it('resolves and logs when the backend delete fails so key removal is not blocked', async () => {
    const chain = chainBuilder().build()
    const delegateAddress = randomAddress()
    const error = new Error(faker.lorem.sentence())
    mockDeleteDelegate.mockRejectedValue(error)

    await expect(getDeleteDelegate()(chain, delegateAddress, deleteDelegateDto)).resolves.toBeUndefined()

    expect(Logger.warn).toHaveBeenCalledWith(
      `Failed to delete delegate ${delegateAddress} on chain ${chain.chainId}`,
      error,
    )
  })
})
