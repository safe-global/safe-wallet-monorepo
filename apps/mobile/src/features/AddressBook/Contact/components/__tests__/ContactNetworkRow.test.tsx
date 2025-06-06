import React from 'react'
import { render, fireEvent } from '@/src/tests/test-utils'
import { Keyboard } from 'react-native'
import { ContactNetworkRow } from '../ContactNetworkRow'
import { useContactNetworkData } from '../../hooks/useContactNetworkData'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

// Mock the useContactNetworkData hook
jest.mock('../../hooks/useContactNetworkData')
const mockUseContactNetworkData = useContactNetworkData as jest.MockedFunction<typeof useContactNetworkData>

// Mock Keyboard.dismiss using jest.spyOn
const mockKeyboardDismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {
  // Mock implementation for Keyboard.dismiss
})

describe('ContactNetworkRow', () => {
  const mockOnPress = jest.fn()
  const mockChainIds = ['1', '5']

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render network label correctly', () => {
    mockUseContactNetworkData.mockReturnValue({
      displayText: '2 Networks',
      selectedChains: [],
    })

    const { getByText } = render(<ContactNetworkRow onPress={mockOnPress} chainIds={mockChainIds} />)

    expect(getByText('Network')).toBeTruthy()
  })

  it('should render display text from hook', () => {
    const mockDisplayText = '2 Networks'
    mockUseContactNetworkData.mockReturnValue({
      displayText: mockDisplayText,
      selectedChains: [],
    })

    const { getByText } = render(<ContactNetworkRow onPress={mockOnPress} chainIds={mockChainIds} />)

    expect(getByText(mockDisplayText)).toBeTruthy()
  })

  it('should render single network name when one chain is selected', () => {
    const mockDisplayText = 'Ethereum Mainnet'
    mockUseContactNetworkData.mockReturnValue({
      displayText: mockDisplayText,
      selectedChains: [{ chainName: 'Ethereum Mainnet', chainId: '1' } as Chain],
    })

    const { getByText } = render(<ContactNetworkRow onPress={mockOnPress} chainIds={['1']} />)

    expect(getByText(mockDisplayText)).toBeTruthy()
  })

  it('should render "All Networks" when no chains are selected', () => {
    const mockDisplayText = 'All Networks'
    mockUseContactNetworkData.mockReturnValue({
      displayText: mockDisplayText,
      selectedChains: [],
    })

    const { getByText } = render(<ContactNetworkRow onPress={mockOnPress} chainIds={[]} />)

    expect(getByText(mockDisplayText)).toBeTruthy()
  })

  it('should call onPress when pressed', () => {
    mockUseContactNetworkData.mockReturnValue({
      displayText: '2 Networks',
      selectedChains: [],
    })

    const { getByText } = render(<ContactNetworkRow onPress={mockOnPress} chainIds={mockChainIds} />)

    const networkElement = getByText('Network')
    const networkRow = networkElement.parent
    if (networkRow) {
      fireEvent.press(networkRow)
      expect(mockOnPress).toHaveBeenCalledTimes(1)
    }
  })

  it('should dismiss keyboard when pressed', () => {
    mockUseContactNetworkData.mockReturnValue({
      displayText: '2 Networks',
      selectedChains: [],
    })

    const { getByText } = render(<ContactNetworkRow onPress={mockOnPress} chainIds={mockChainIds} />)

    const networkElement = getByText('Network')
    const networkRow = networkElement.parent
    if (networkRow) {
      fireEvent.press(networkRow)
      expect(mockKeyboardDismiss).toHaveBeenCalledTimes(1)
    }
  })

  it('should call useContactNetworkData with correct chainIds', () => {
    mockUseContactNetworkData.mockReturnValue({
      displayText: '2 Networks',
      selectedChains: [],
    })

    render(<ContactNetworkRow onPress={mockOnPress} chainIds={mockChainIds} />)

    expect(mockUseContactNetworkData).toHaveBeenCalledWith(mockChainIds)
  })

  it('should render component structure correctly', () => {
    mockUseContactNetworkData.mockReturnValue({
      displayText: '2 Networks',
      selectedChains: [],
    })

    const { getByText } = render(<ContactNetworkRow onPress={mockOnPress} chainIds={mockChainIds} />)

    // Check that the component structure is correct
    expect(getByText('Network')).toBeTruthy()
    expect(getByText('2 Networks')).toBeTruthy()
  })

  it('should handle empty chainIds array', () => {
    mockUseContactNetworkData.mockReturnValue({
      displayText: 'All Networks',
      selectedChains: [],
    })

    const { getByText } = render(<ContactNetworkRow onPress={mockOnPress} chainIds={[]} />)

    expect(getByText('All Networks')).toBeTruthy()
    expect(mockUseContactNetworkData).toHaveBeenCalledWith([])
  })

  it('should handle multiple chainIds', () => {
    const multipleChainIds = ['1', '5', '137', '42161']
    mockUseContactNetworkData.mockReturnValue({
      displayText: '4 Networks',
      selectedChains: [],
    })

    const { getByText } = render(<ContactNetworkRow onPress={mockOnPress} chainIds={multipleChainIds} />)

    expect(getByText('4 Networks')).toBeTruthy()
    expect(mockUseContactNetworkData).toHaveBeenCalledWith(multipleChainIds)
  })
})
