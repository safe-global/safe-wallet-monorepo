import { renderHook, waitFor } from '@/tests/test-utils'
import { useMasterCopies, MasterCopyDeployer } from '@/hooks/useMasterCopies'
import * as useChainId from '@/hooks/useChainId'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import type { MasterCopy as MasterCopyType } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

describe('useMasterCopies hook', () => {
  const chainId = '1'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChainId, 'default').mockReturnValue(chainId)
  })

  it('should fetch master copies successfully', async () => {
    const { result } = renderHook(() => useMasterCopies())

    // Initially should be loading
    expect(result.current[2]).toBe(true) // isLoading

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current[2]).toBe(false) // isLoading should be false
    })

    const [masterCopies, error] = result.current

    // Verify data was fetched
    expect(masterCopies).toBeDefined()
    expect(masterCopies?.length).toBe(2)
    expect(error).toBeUndefined()

    // Verify data transformation
    const gnosis = masterCopies?.find((mc) => mc.deployer === MasterCopyDeployer.GNOSIS)
    expect(gnosis).toBeDefined()
    expect(gnosis?.deployerRepoUrl).toBe('https://github.com/gnosis/safe-contracts/releases')
  })

  it('should transform Gnosis master copies correctly', async () => {
    const { result } = renderHook(() => useMasterCopies())

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    const [masterCopies] = result.current
    const gnosis = masterCopies?.find((mc) => mc.deployer === MasterCopyDeployer.GNOSIS)

    expect(gnosis).toEqual(
      expect.objectContaining({
        deployer: MasterCopyDeployer.GNOSIS,
        deployerRepoUrl: 'https://github.com/gnosis/safe-contracts/releases',
        address: '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766',
        version: '1.3.0',
      }),
    )
  })

  it('should transform Circles master copies correctly', async () => {
    const circlesMasterCopies: MasterCopyType[] = [
      {
        address: '0x123456789',
        version: 'circles-1.2.0',
      },
    ]

    server.use(
      http.get<{ chainId: string }, never, MasterCopyType[]>(
        `${GATEWAY_URL}/v1/chains/:chainId/about/master-copies`,
        () => {
          return HttpResponse.json(circlesMasterCopies)
        },
      ),
    )

    const { result } = renderHook(() => useMasterCopies())

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    const [masterCopies] = result.current
    const circles = masterCopies?.find((mc) => mc.deployer === MasterCopyDeployer.CIRCLES)

    expect(circles).toEqual(
      expect.objectContaining({
        deployer: MasterCopyDeployer.CIRCLES,
        deployerRepoUrl: 'https://github.com/CirclesUBI/safe-contracts/releases',
        address: '0x123456789',
        version: 'circles', // Should extract version before dash
      }),
    )
  })

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/about/master-copies`, () => {
        return HttpResponse.error()
      }),
    )

    const { result } = renderHook(() => useMasterCopies())

    await waitFor(() => {
      expect(result.current[2]).toBe(false) // isLoading should be false
    })

    const [masterCopies, error] = result.current

    // Data should be undefined on error
    expect(masterCopies).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('should handle empty master copies list', async () => {
    server.use(
      http.get<{ chainId: string }, never, MasterCopyType[]>(
        `${GATEWAY_URL}/v1/chains/:chainId/about/master-copies`,
        () => {
          return HttpResponse.json([])
        },
      ),
    )

    const { result } = renderHook(() => useMasterCopies())

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    const [masterCopies, error] = result.current

    expect(masterCopies).toEqual([])
    expect(error).toBeUndefined()
  })

  it('should refetch when chain ID changes', async () => {
    const { result, rerender } = renderHook(() => useMasterCopies())

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    const firstFetch = result.current[0]
    expect(firstFetch).toBeDefined()

    // Change chain ID
    const newChainId = '137'
    jest.spyOn(useChainId, 'default').mockReturnValue(newChainId)

    rerender()

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    const secondFetch = result.current[0]

    // Data should still be valid (MSW returns same data for all chains by default)
    expect(secondFetch).toBeDefined()
    expect(secondFetch?.length).toBe(2)
  })

  it('should return data in tuple format compatible with destructuring', async () => {
    const { result } = renderHook(() => useMasterCopies())

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    const [data, error, isLoading] = result.current

    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(isLoading).toBe(false)
  })
})
