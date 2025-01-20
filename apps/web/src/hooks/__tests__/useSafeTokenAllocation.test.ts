import { renderHook, waitFor } from '@/tests/test-utils'
import { type JsonRpcProvider, keccak256, parseEther, toUtf8Bytes, toBeHex, AbiCoder } from 'ethers'
import useSafeTokenAllocation, {
  type VestingData,
  _getRedeemDeadline,
  useSafeVotingPower,
  type Vesting,
} from '../useSafeTokenAllocation'
import * as web3 from '../wallets/web3'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

const setupFetchStub =
  (data: any, status: number = 200) =>
  () => {
    return Promise.resolve({
      json: () => Promise.resolve(data),
      status,
      ok: status === 200,
    })
  }

describe('_getRedeemDeadline', () => {
  const mockProvider = {
    call: jest.fn(),
  } as unknown as JsonRpcProvider

  beforeEach(() => {
    // Clear memoization cache
    _getRedeemDeadline.cache.clear?.()

    jest.clearAllMocks()
  })

  it('should only call the provider once per address on a chain', async () => {
    for (let i = 0; i < 10; i++) {
      await _getRedeemDeadline({ chainId: 1, contract: toBeHex('0x1', 20) } as VestingData, mockProvider)
    }

    expect(mockProvider.call).toHaveBeenCalledTimes(1)
  })

  it('should not memoize different addresses on the same chain', async () => {
    const chainId = 1

    await _getRedeemDeadline({ chainId, contract: toBeHex('0x1', 20) } as VestingData, mockProvider)
    await _getRedeemDeadline({ chainId, contract: toBeHex('0x2', 20) } as VestingData, mockProvider)

    expect(mockProvider.call).toHaveBeenCalledTimes(2)
  })

  it('should not memoize the same address on difference chains', async () => {
    for await (const i of Array.from({ length: 10 }, (_, i) => i + 1)) {
      await _getRedeemDeadline({ chainId: i, contract: toBeHex('0x1', 20) } as VestingData, mockProvider)
    }

    expect(mockProvider.call).toHaveBeenCalledTimes(10)
  })
})

const originalGlobalFetch = global.fetch
describe('Allocations', () => {
  afterAll(() => {
    global.fetch = originalGlobalFetch
  })

  beforeEach(() => {
    jest.resetAllMocks()
    // Clear memoization cache
    _getRedeemDeadline.cache.clear?.()

    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
      () =>
        ({
          safeAddress: toBeHex('0x2', 20),
          safe: {
            address: toBeHex('0x2', 20),
            chainId: '1',
          },
        }) as any,
    )
  })

  describe('useSafeTokenAllocation', () => {
    it('should return undefined without safe address', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
        () =>
          ({
            safeAddress: undefined,
            safe: {
              address: undefined,
              chainId: '1',
            },
          }) as any,
      )

      const { result } = renderHook(() => useSafeTokenAllocation())

      await waitFor(() => {
        expect(result.current[1]).toBeFalsy()
        expect(result.current[0]).toBeUndefined()
      })
    })

    it('should return an empty array without web3Provider', async () => {
      global.fetch = jest.fn().mockImplementation(setupFetchStub('', 404))
      const { result } = renderHook(() => useSafeTokenAllocation())

      await waitFor(() => {
        expect(result.current[1]).toBeFalsy()
        expect(result.current[0]).toStrictEqual([])
      })
    })

    it('should return an empty array if no allocations exist', async () => {
      global.fetch = jest.fn().mockImplementation(setupFetchStub('', 404))
      const mockFetch = jest.spyOn(global, 'fetch')

      const { result } = renderHook(() => useSafeTokenAllocation())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
        expect(result.current[0]).toStrictEqual([])
        expect(result.current[1]).toBeFalsy()
      })
    })

    it('should calculate expiration', async () => {
      const mockAllocations = [
        {
          tag: 'user',
          account: toBeHex('0x2', 20),
          chainId: 1,
          contract: toBeHex('0xabc', 20),
          vestingId: toBeHex('0x4110', 32),
          durationWeeks: 208,
          startDate: 1657231200,
          amount: '2000',
          curve: 0,
          proof: [],
        },
      ]

      global.fetch = jest.fn().mockImplementation(setupFetchStub(mockAllocations, 200))
      const mockFetch = jest.spyOn(global, 'fetch')

      jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(
        () =>
          ({
            call: (transaction: any) => {
              const vestingsSigHash = keccak256(toUtf8Bytes('vestings(bytes32)')).slice(0, 10)
              const redeemDeadlineSigHash = keccak256(toUtf8Bytes('redeemDeadline()')).slice(0, 10)

              if (transaction.data?.startsWith(vestingsSigHash)) {
                return Promise.resolve(
                  AbiCoder.defaultAbiCoder().encode(
                    ['address', 'uint8', 'bool', 'uint16', 'uint64', 'uint128', 'uint128', 'uint64', 'bool'],
                    [ZERO_ADDRESS, '0x1', false, 208, 1657231200, 2000, 0, 0, false],
                  ),
                )
              }
              if (transaction.data?.startsWith(redeemDeadlineSigHash)) {
                // 30th Nov 2022
                return Promise.resolve(AbiCoder.defaultAbiCoder().encode(['uint64'], [1669766400]))
              }
              return Promise.resolve('0x')
            },
          }) as any,
      )

      const { result } = renderHook(() => useSafeTokenAllocation())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
        expect(result.current[0]).toEqual([
          {
            ...mockAllocations[0],
            amountClaimed: '0',
            isExpired: true,
            isRedeemed: false,
          },
        ])
        expect(result.current[1]).toBeFalsy()
      })
    })

    it('should calculate redemption', async () => {
      const mockAllocation = [
        {
          tag: 'user',
          account: toBeHex('0x2', 20),
          chainId: 1,
          contract: toBeHex('0xabc', 20),
          vestingId: toBeHex('0x4110', 32),
          durationWeeks: 208,
          startDate: 1657231200,
          amount: '2000',
          curve: 0,
          proof: [],
        },
      ]

      global.fetch = jest.fn().mockImplementation(setupFetchStub(mockAllocation, 200))
      const mockFetch = jest.spyOn(global, 'fetch')

      jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(
        () =>
          ({
            call: (transaction: any) => {
              const vestingsSigHash = keccak256(toUtf8Bytes('vestings(bytes32)')).slice(0, 10)
              const redeemDeadlineSigHash = keccak256(toUtf8Bytes('redeemDeadline()')).slice(0, 10)

              if (transaction.data?.startsWith(vestingsSigHash)) {
                return Promise.resolve(
                  AbiCoder.defaultAbiCoder().encode(
                    ['address', 'uint8', 'bool', 'uint16', 'uint64', 'uint128', 'uint128', 'uint64', 'bool'],
                    [toBeHex('0x2', 20), '0x1', false, 208, 1657231200, 2000, 0, 0, false],
                  ),
                )
              }
              if (transaction.data?.startsWith(redeemDeadlineSigHash)) {
                // 08.Dec 2200
                return Promise.resolve(AbiCoder.defaultAbiCoder().encode(['uint64'], [7287610110]))
              }
              return Promise.resolve('0x')
            },
          }) as any,
      )

      const { result } = renderHook(() => useSafeTokenAllocation())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
        expect(result.current[0]).toEqual([
          {
            ...mockAllocation[0],
            amountClaimed: BigInt(0),
            isExpired: false,
            isRedeemed: true,
          },
        ])
        expect(result.current[1]).toBeFalsy()
      })
    })
  })

  describe('useSafeTokenBalance', () => {
    it('should return undefined without allocation data', async () => {
      const { result } = renderHook(() => useSafeVotingPower())

      await waitFor(() => {
        expect(result.current[1]).toBeFalsy()
        expect(result.current[0]).toBeUndefined()
      })
    })

    it('should return undefined without safe address', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
        () =>
          ({
            safeAddress: undefined,
            safe: {
              address: undefined,
              chainId: '1',
            },
          }) as any,
      )

      const { result } = renderHook(() => useSafeVotingPower([{} as Vesting]))

      await waitFor(() => {
        expect(result.current[1]).toBeFalsy()
        expect(result.current[0]).toBeUndefined()
      })
    })

    it('should return total balance of tokens held and tokens in locking contract if no allocation exists', async () => {
      jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(
        () =>
          ({
            call: (transaction: any) => {
              const balanceOfSigHash = keccak256(toUtf8Bytes('balanceOf(address)')).slice(0, 10)
              const lockingBalanceSigHash = keccak256(toUtf8Bytes('getUserTokenBalance(address)')).slice(0, 10)

              if (transaction.data?.startsWith(balanceOfSigHash)) {
                return Promise.resolve('0x' + parseEther('100').toString(16))
              }
              if (transaction.data?.startsWith(lockingBalanceSigHash)) {
                return Promise.resolve('0x' + parseEther('100').toString(16))
              }
              return Promise.resolve('0x')
            },
          }) as any,
      )

      const { result } = renderHook(() => useSafeVotingPower())
      await waitFor(() => {
        expect(result.current[0] === parseEther('200')).toBeTruthy()
        expect(result.current[1]).toBeFalsy()
      })
    })

    test('formula: allocation - claimed + token balance + locking balance', async () => {
      jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(
        () =>
          ({
            call: (transaction: any) => {
              const balanceOfSigHash = keccak256(toUtf8Bytes('balanceOf(address)')).slice(0, 10)
              const lockingBalanceSigHash = keccak256(toUtf8Bytes('getUserTokenBalance(address)')).slice(0, 10)

              if (transaction.data?.startsWith(balanceOfSigHash)) {
                return Promise.resolve('0x' + BigInt('400').toString(16))
              }
              if (transaction.data?.startsWith(lockingBalanceSigHash)) {
                return Promise.resolve('0x' + BigInt('200').toString(16))
              }
              return Promise.resolve('0x')
            },
          }) as any,
      )

      const mockAllocation: Vesting[] = [
        {
          tag: 'user',
          account: toBeHex('0x2', 20),
          chainId: 1,
          contract: toBeHex('0xabc', 20),
          vestingId: toBeHex('0x4110', 32),
          durationWeeks: 208,
          startDate: 1657231200,
          amount: '2000',
          curve: 0,
          proof: [],
          isExpired: false,
          isRedeemed: false,
          amountClaimed: '1000',
        },
      ]

      const { result } = renderHook(() => useSafeVotingPower(mockAllocation))

      await waitFor(() => {
        expect(Number(result.current[0])).toEqual(2000 - 1000 + 400 + 200)
        expect(result.current[1]).toBeFalsy()
      })
    })

    test('formula: allocation - claimed + token balance + locking balance, everything claimed and no balance', async () => {
      jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(
        () =>
          ({
            call: (transaction: any) => {
              const balanceOfSigHash = keccak256(toUtf8Bytes('balanceOf(address)')).slice(0, 10)
              const lockingBalanceSigHash = keccak256(toUtf8Bytes('getUserTokenBalance(address)')).slice(0, 10)

              if (transaction.data?.startsWith(balanceOfSigHash)) {
                return Promise.resolve('0x' + BigInt('0').toString(16))
              }
              if (transaction.data?.startsWith(lockingBalanceSigHash)) {
                return Promise.resolve('0x' + BigInt('0').toString(16))
              }
              return Promise.resolve('0x')
            },
          }) as any,
      )

      const mockAllocation: Vesting[] = [
        {
          tag: 'user',
          account: toBeHex('0x2', 20),
          chainId: 1,
          contract: toBeHex('0xabc', 20),
          vestingId: toBeHex('0x4110', 32),
          durationWeeks: 208,
          startDate: 1657231200,
          amount: '2000',
          curve: 0,
          proof: [],
          isExpired: false,
          isRedeemed: false,
          amountClaimed: '2000',
        },
      ]

      const { result } = renderHook(() => useSafeVotingPower(mockAllocation))

      await waitFor(() => {
        expect(Number(result.current[0])).toEqual(0)
        expect(result.current[1]).toBeFalsy()
      })
    })
  })
})
