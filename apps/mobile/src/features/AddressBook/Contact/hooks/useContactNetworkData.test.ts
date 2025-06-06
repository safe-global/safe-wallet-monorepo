import { useContactNetworkData } from './useContactNetworkData'
import { mockedChains } from '@/src/store/constants'
import * as storeHooks from '@/src/store/hooks'

// Mock chain data for testing - using a subset of mockedChains from constants
const mockChain1 = mockedChains[0] // Gnosis Chain (chainId: "100")
const mockChain2 = mockedChains[1] // Polygon (chainId: "137")
const mockChain3 = mockedChains[2] // Arbitrum (chainId: "42161")

// Mock the useAppSelector hook
const mockUseAppSelector = jest.spyOn(storeHooks, 'useAppSelector')

describe('useContactNetworkData', () => {
  beforeEach(() => {
    // Reset mock implementations
    mockUseAppSelector.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return "All Networks" when chainIds is empty', () => {
    // Mock the selector to return empty array for empty chainIds
    mockUseAppSelector.mockReturnValue([])

    const result = useContactNetworkData([])

    expect(result.selectedChains).toEqual([])
    expect(result.displayText).toBe('All Networks')
  })

  it('should return single chain name when chainIds has one item', () => {
    // Mock the selector to return the first chain
    mockUseAppSelector.mockReturnValue([mockChain1])

    const result = useContactNetworkData(['100'])

    expect(result.selectedChains).toHaveLength(1)
    expect(result.selectedChains[0]).toEqual(mockChain1)
    expect(result.displayText).toBe('Gnosis Chain')
  })

  it('should return chain count when chainIds has multiple items', () => {
    // Mock the selector to return multiple chains
    mockUseAppSelector.mockReturnValue([mockChain1, mockChain2])

    const result = useContactNetworkData(['100', '137'])

    expect(result.selectedChains).toHaveLength(2)
    expect(result.selectedChains).toEqual([mockChain1, mockChain2])
    expect(result.displayText).toBe('2 Networks')
  })

  it('should return count text for three or more networks', () => {
    // Mock the selector to return all three chains
    mockUseAppSelector.mockReturnValue([mockChain1, mockChain2, mockChain3])

    const result = useContactNetworkData(['100', '137', '42161'])

    expect(result.selectedChains).toHaveLength(3)
    expect(result.selectedChains).toEqual([mockChain1, mockChain2, mockChain3])
    expect(result.displayText).toBe('3 Networks')
  })

  it('should filter out invalid chain IDs', () => {
    // Mock the selector to return only valid chains (invalid ones are filtered by the selector)
    mockUseAppSelector.mockReturnValue([mockChain1, mockChain2])

    const result = useContactNetworkData(['100', 'invalid-chain-id', '137'])

    expect(result.selectedChains).toHaveLength(2)
    expect(result.selectedChains).toEqual([mockChain1, mockChain2])
    expect(result.displayText).toBe('3 Networks')
  })

  it('should handle when no chains match the provided IDs', () => {
    // Mock the selector to return empty array (no matching chains)
    mockUseAppSelector.mockReturnValue([])

    const result = useContactNetworkData(['999', '888'])

    expect(result.selectedChains).toHaveLength(0)
    expect(result.displayText).toBe('2 Networks')
  })

  it('should handle empty chains data for single chain', () => {
    // Mock the selector to return empty array
    mockUseAppSelector.mockReturnValue([])

    const result = useContactNetworkData(['100'])

    expect(result.selectedChains).toHaveLength(0)
    expect(result.displayText).toBe('Unknown Network')
  })

  it('should handle single chain with correct name formatting', () => {
    // Mock the selector to return Polygon chain
    mockUseAppSelector.mockReturnValue([mockChain2])

    const result = useContactNetworkData(['137'])

    expect(result.selectedChains).toHaveLength(1)
    expect(result.selectedChains[0]).toEqual(mockChain2)
    expect(result.displayText).toBe('Polygon')
  })

  it('should maintain order of chains as returned by selector', () => {
    // Mock the selector to return chains in specific order
    mockUseAppSelector.mockReturnValue([mockChain1, mockChain2, mockChain3])

    const result = useContactNetworkData(['137', '100', '42161'])

    expect(result.selectedChains).toHaveLength(3)
    // The order should match the order returned by getChainsByIds selector
    expect(result.selectedChains[0].chainId).toBe('100')
    expect(result.selectedChains[1].chainId).toBe('137')
    expect(result.selectedChains[2].chainId).toBe('42161')
  })

  it('should handle Arbitrum chain correctly', () => {
    // Mock the selector to return Arbitrum chain
    mockUseAppSelector.mockReturnValue([mockChain3])

    const result = useContactNetworkData(['42161'])

    expect(result.selectedChains).toHaveLength(1)
    expect(result.selectedChains[0]).toEqual(mockChain3)
    expect(result.displayText).toBe('Arbitrum')
  })

  it('should handle edge case where single chain is not found', () => {
    // Mock the selector to return empty array for a single chainId
    mockUseAppSelector.mockReturnValue([])

    const result = useContactNetworkData(['999'])

    expect(result.selectedChains).toHaveLength(0)
    expect(result.displayText).toBe('Unknown Network')
  })

  it('should handle very large number of chains', () => {
    // Mock the selector to return 10 chains
    const manyChains = Array(10).fill(mockChain1)
    mockUseAppSelector.mockReturnValue(manyChains)

    const result = useContactNetworkData(Array(10).fill('100'))

    expect(result.selectedChains).toHaveLength(10)
    expect(result.displayText).toBe('10 Networks')
  })

  it('should handle empty selectedChains for multiple chainIds', () => {
    // Mock the selector to return empty array even for multiple chainIds
    mockUseAppSelector.mockReturnValue([])

    const result = useContactNetworkData(['100', '137', '42161'])

    expect(result.selectedChains).toHaveLength(0)
    expect(result.displayText).toBe('3 Networks')
  })
})
