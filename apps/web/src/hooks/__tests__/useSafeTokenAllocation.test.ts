import { mockWeb3Provider, renderHook, waitFor } from '@/tests/test-utils'
import { parseEther, toBeHex, AbiCoder } from 'ethers'
import useSafeTokenAllocation, { useSafeVotingPower, type Vesting } from '../useSafeTokenAllocation'
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

const originalGlobalFetch = global.fetch
describe('Allocations', () => {
  afterAll(() => {
    global.fetch = originalGlobalFetch
  })

  beforeEach(() => {
    jest.resetAllMocks()
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

    it('should return an empty array if no allocations exist', async () => {
      global.fetch = jest.fn().mockImplementation(setupFetchStub('', 404))
      const mockFetch = jest.spyOn(global, 'fetch')

      mockWeb3Provider([])

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

      mockWeb3Provider([
        {
          signature: 'vestings(bytes32)',
          returnType: 'raw',
          returnValue: AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint8', 'bool', 'uint16', 'uint64', 'uint128', 'uint128', 'uint64', 'bool'],
            [ZERO_ADDRESS, '0x1', false, 208, 1657231200, 2000, 0, 0, false],
          ),
        },
      ])

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

      mockWeb3Provider([
        {
          signature: 'vestings(bytes32)',
          returnType: 'raw',
          returnValue: AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint8', 'bool', 'uint16', 'uint64', 'uint128', 'uint128', 'uint64', 'bool'],
            [toBeHex('0x2', 20), '0x1', false, 208, 1657231200, 2000, 0, 0, false],
          ),
        },
      ])

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
      mockWeb3Provider([
        {
          signature: 'balanceOf(address)',
          returnType: 'uint256',
          returnValue: parseEther('100'),
        },
        {
          signature: 'getUserTokenBalance(address)',
          returnType: 'uint256',
          returnValue: parseEther('100'),
        },
      ])

      const { result } = renderHook(() => useSafeVotingPower())
      await waitFor(() => {
        expect(result.current[0]).toBe(parseEther('200'))
        expect(result.current[1]).toBeFalsy()
      })
    })

    test('formula: allocation - claimed + token balance + locking balance', async () => {
      mockWeb3Provider([
        {
          signature: 'balanceOf(address)',
          returnType: 'uint256',
          returnValue: '400',
        },
        {
          signature: 'getUserTokenBalance(address)',
          returnType: 'uint256',
          returnValue: '200',
        },
      ])

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
      mockWeb3Provider([
        {
          signature: 'balanceOf(address)',
          returnType: 'uint256',
          returnValue: parseEther('0'),
        },
        {
          signature: 'getUserTokenBalance(address)',
          returnType: 'uint256',
          returnValue: parseEther('0'),
        },
      ])

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
