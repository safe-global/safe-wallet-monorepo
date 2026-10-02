import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { mockHasFeature } from '@/tests/mocks/hooks'
import { useDelegateMutations } from '../useDelegateMutations'

jest.mock('@/hooks/useChains', () => ({ useHasFeature: jest.fn() }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  useDelegatesPostDelegateV2Mutation: jest.fn(),
  useDelegatesPostDelegateV3Mutation: jest.fn(),
  useDelegatesDeleteDelegateV2Mutation: jest.fn(),
  useDelegatesDeleteDelegateV3Mutation: jest.fn(),
}))

const {
  useDelegatesPostDelegateV2Mutation,
  useDelegatesPostDelegateV3Mutation,
  useDelegatesDeleteDelegateV2Mutation,
  useDelegatesDeleteDelegateV3Mutation,
} = jest.requireMock<
  Record<
    | 'useDelegatesPostDelegateV2Mutation'
    | 'useDelegatesPostDelegateV3Mutation'
    | 'useDelegatesDeleteDelegateV2Mutation'
    | 'useDelegatesDeleteDelegateV3Mutation',
    jest.Mock
  >
>('@safe-global/store/gateway/AUTO_GENERATED/delegates')

const randomAddress = () => checksumAddress(faker.finance.ethereumAddress())

const resolvingTrigger = () => jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() })

describe('useDelegateMutations', () => {
  const chainId = faker.string.numeric()
  const delegateAddress = randomAddress()
  const createDelegateDto = {
    safe: randomAddress(),
    delegate: delegateAddress,
    delegator: randomAddress(),
    signature: faker.string.hexadecimal({ length: 130 }),
    label: faker.word.words(),
  }
  const deleteDelegateDto = {
    delegator: randomAddress(),
    safe: randomAddress(),
    signature: faker.string.hexadecimal({ length: 130 }),
  }

  let addDelegateV2: jest.Mock
  let addDelegateV3: jest.Mock
  let deleteDelegateV2: jest.Mock
  let deleteDelegateV3: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    addDelegateV2 = resolvingTrigger()
    addDelegateV3 = resolvingTrigger()
    deleteDelegateV2 = resolvingTrigger()
    deleteDelegateV3 = resolvingTrigger()

    useDelegatesPostDelegateV2Mutation.mockReturnValue([addDelegateV2, {}])
    useDelegatesPostDelegateV3Mutation.mockReturnValue([addDelegateV3, {}])
    useDelegatesDeleteDelegateV2Mutation.mockReturnValue([deleteDelegateV2, {}])
    useDelegatesDeleteDelegateV3Mutation.mockReturnValue([deleteDelegateV3, {}])
  })

  describe('with QUEUE_SERVICE', () => {
    beforeEach(() => {
      mockHasFeature({ [FEATURES.QUEUE_SERVICE]: true })
    })

    it('adds the delegate through the queue service and resolves with the unwrapped result', async () => {
      const response = faker.string.uuid()
      addDelegateV3.mockReturnValue({ unwrap: () => Promise.resolve(response) })
      const { result } = renderHook(() => useDelegateMutations())

      await expect(result.current.addDelegate({ chainId, createDelegateDto })).resolves.toBe(response)

      expect(addDelegateV3).toHaveBeenCalledWith({ chainId, createDelegateDto })
      expect(addDelegateV2).not.toHaveBeenCalled()
    })

    it('deletes the delegate through the queue service with the v3 DTO key', async () => {
      const { result } = renderHook(() => useDelegateMutations())

      await result.current.deleteDelegate({ chainId, delegateAddress, deleteDelegateDto })

      expect(deleteDelegateV3).toHaveBeenCalledWith({
        chainId,
        delegateAddress,
        deleteDelegateV3Dto: deleteDelegateDto,
      })
      expect(deleteDelegateV2).not.toHaveBeenCalled()
    })

    it('rejects when the queue service request fails', async () => {
      const error = new Error(faker.lorem.sentence())
      deleteDelegateV3.mockReturnValue({ unwrap: () => Promise.reject(error) })
      const { result } = renderHook(() => useDelegateMutations())

      await expect(result.current.deleteDelegate({ chainId, delegateAddress, deleteDelegateDto })).rejects.toBe(error)
    })
  })

  describe('without QUEUE_SERVICE', () => {
    beforeEach(() => {
      mockHasFeature({ [FEATURES.QUEUE_SERVICE]: false })
    })

    it('adds the delegate through the transaction service and resolves with the unwrapped result', async () => {
      const response = faker.string.uuid()
      addDelegateV2.mockReturnValue({ unwrap: () => Promise.resolve(response) })
      const { result } = renderHook(() => useDelegateMutations())

      await expect(result.current.addDelegate({ chainId, createDelegateDto })).resolves.toBe(response)

      expect(addDelegateV2).toHaveBeenCalledWith({ chainId, createDelegateDto })
      expect(addDelegateV3).not.toHaveBeenCalled()
    })

    it('deletes the delegate through the transaction service with the v2 DTO key', async () => {
      const { result } = renderHook(() => useDelegateMutations())

      await result.current.deleteDelegate({ chainId, delegateAddress, deleteDelegateDto })

      expect(deleteDelegateV2).toHaveBeenCalledWith({
        chainId,
        delegateAddress,
        deleteDelegateV2Dto: deleteDelegateDto,
      })
      expect(deleteDelegateV3).not.toHaveBeenCalled()
    })

    it('rejects when the transaction service request fails', async () => {
      const error = new Error(faker.lorem.sentence())
      addDelegateV2.mockReturnValue({ unwrap: () => Promise.reject(error) })
      const { result } = renderHook(() => useDelegateMutations())

      await expect(result.current.addDelegate({ chainId, createDelegateDto })).rejects.toBe(error)
    })
  })

  it('switches mutations when the chain flag changes', async () => {
    mockHasFeature({ [FEATURES.QUEUE_SERVICE]: false })
    const { result, rerender } = renderHook(() => useDelegateMutations())

    mockHasFeature({ [FEATURES.QUEUE_SERVICE]: true })
    rerender()
    await result.current.addDelegate({ chainId, createDelegateDto })

    expect(addDelegateV3).toHaveBeenCalledWith({ chainId, createDelegateDto })
    expect(addDelegateV2).not.toHaveBeenCalled()
  })
})
