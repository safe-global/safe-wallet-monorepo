import type { JsonRpcProvider } from 'ethers'
import { getAddress, id } from 'ethers'
import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import { getReadOnlyProvider } from '@/hooks/wallets/getReadOnlyProvider'
import { readHeldRoots } from '../../../services/readHeldRoots'
import { useHeldRootsReader } from '../useHeldRootsReader'

jest.mock('@/hooks/wallets/getReadOnlyProvider', () => ({ getReadOnlyProvider: jest.fn() }))
jest.mock('../../../services/readHeldRoots', () => ({ readHeldRoots: jest.fn() }))

const CHAIN_ID = '11155111'
const GUARD = getAddress(faker.finance.ethereumAddress())
const SAFE = getAddress(faker.finance.ethereumAddress())
const ROOT = id(faker.string.uuid())
const provider = {} as JsonRpcProvider

describe('useHeldRootsReader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChains, 'useChain').mockReturnValue(chainBuilder().with({ chainId: CHAIN_ID }).build())
    jest.mocked(getReadOnlyProvider).mockResolvedValue(provider)
  })

  it('should, when the guard holds a root, report it', async () => {
    jest.mocked(readHeldRoots).mockResolvedValue([ROOT])
    const { result } = renderHook(() => useHeldRootsReader(CHAIN_ID))

    await expect(result.current(GUARD, SAFE, [ROOT])).resolves.toEqual([ROOT])
    expect(readHeldRoots).toHaveBeenCalledWith(provider, GUARD, SAFE, [ROOT])
  })

  it('should, when the read fails, report no held root', async () => {
    jest.mocked(readHeldRoots).mockRejectedValue(new Error('rpc down'))
    const { result } = renderHook(() => useHeldRootsReader(CHAIN_ID))

    await expect(result.current(GUARD, SAFE, [ROOT])).resolves.toEqual([])
  })

  it('should, when the chain is unknown, report no held root without reading', async () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(undefined)
    const { result } = renderHook(() => useHeldRootsReader(CHAIN_ID))

    await expect(result.current(GUARD, SAFE, [ROOT])).resolves.toEqual([])
    expect(readHeldRoots).not.toHaveBeenCalled()
  })
})
