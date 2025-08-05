import React from 'react'
import { useRecipientItem } from './useRecipientItem'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'

// Mock the useOpenExplorer hook
const mockViewOnExplorer = jest.fn()
jest.mock('@/src/features/ConfirmTx/hooks/useOpenExplorer', () => ({
  useOpenExplorer: jest.fn(() => mockViewOnExplorer),
}))

// Mock React hooks
const mockUseMemo = jest.fn()
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useMemo: (fn: () => unknown, deps: unknown[]) => mockUseMemo(fn, deps),
}))

// Mock the components used in the hook
jest.mock('@/src/components/Identicon', () => ({
  Identicon: 'Identicon',
}))

jest.mock('@/src/components/EthAddress', () => ({
  EthAddress: 'EthAddress',
}))

jest.mock('@/src/components/SafeFontIcon', () => ({
  SafeFontIcon: 'SafeFontIcon',
}))

jest.mock('react-native', () => ({
  TouchableOpacity: 'TouchableOpacity',
}))

jest.mock('tamagui', () => ({
  View: 'View',
}))

const createMockOrder = (
  receiver?: string,
  owner = '0x1234567890123456789012345678901234567890',
): OrderTransactionInfo => ({
  type: 'SwapOrder',
  uid: '0x123456789',
  status: 'open',
  kind: 'sell',
  orderClass: 'market',
  validUntil: Date.now() / 1000 + 3600,
  sellAmount: '1000000000000000000',
  buyAmount: '2000000000000000000',
  executedSellAmount: '0',
  executedBuyAmount: '0',
  sellToken: {
    address: '0xtoken1',
    name: 'Token1',
    symbol: 'TK1',
    decimals: 18,
    logoUri: 'https://example.com/token1.png',
    trusted: true,
  },
  buyToken: {
    address: '0xtoken2',
    name: 'Token2',
    symbol: 'TK2',
    decimals: 18,
    logoUri: 'https://example.com/token2.png',
    trusted: true,
  },
  explorerUrl: 'https://explorer.example.com',
  executedFee: '0',
  executedFeeToken: '0xfeetoken',
  receiver,
  owner,
  fullAppData: {
    metadata: {
      orderClass: { orderClass: 'market' },
      quote: { slippageBips: 50 },
    },
  },
})

describe('useRecipientItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock useMemo to return the result of the callback immediately
    mockUseMemo.mockImplementation((fn) => fn())
  })

  it('should return empty array when receiver is undefined', () => {
    const mockOrder = createMockOrder()

    const result = useRecipientItem(mockOrder)

    expect(result).toEqual([])
  })

  it('should return empty array when receiver equals owner', () => {
    const owner = '0x1234567890123456789012345678901234567890'
    const mockOrder = createMockOrder(owner, owner)

    const result = useRecipientItem(mockOrder)

    expect(result).toEqual([])
  })

  it('should return recipient items when receiver differs from owner', () => {
    const owner = '0x1234567890123456789012345678901234567890'
    const receiver = '0x9876543210987654321098765432109876543210'
    const mockOrder = createMockOrder(receiver, owner)

    const result = useRecipientItem(mockOrder)

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('label')
    expect(result[0]).toHaveProperty('render')
    // Check it's a LabelValueItem (has label property)
    const item = result[0] as { label: string; render: () => React.ReactNode }
    expect(item.label).toBe('Recipient')
  })

  it('should call useOpenExplorer with correct receiver address', () => {
    const owner = '0x1234567890123456789012345678901234567890'
    const receiver = '0x9876543210987654321098765432109876543210'
    const mockOrder = createMockOrder(receiver, owner)

    const { useOpenExplorer } = require('@/src/features/ConfirmTx/hooks/useOpenExplorer')

    useRecipientItem(mockOrder)

    expect(useOpenExplorer).toHaveBeenCalledWith(receiver)
  })

  it('should call useOpenExplorer with empty string when receiver is undefined', () => {
    const mockOrder = createMockOrder()

    const { useOpenExplorer } = require('@/src/features/ConfirmTx/hooks/useOpenExplorer')

    useRecipientItem(mockOrder)

    expect(useOpenExplorer).toHaveBeenCalledWith('')
  })

  it('should handle edge case with null receiver', () => {
    const mockOrder = {
      ...createMockOrder(),
      receiver: null,
    } as OrderTransactionInfo & { receiver: null }

    const result = useRecipientItem(mockOrder)

    expect(result).toEqual([])
  })

  it('should return proper ListTableItem structure with render function', () => {
    const owner = '0x1234567890123456789012345678901234567890'
    const receiver = '0x9876543210987654321098765432109876543210'
    const mockOrder = createMockOrder(receiver, owner)

    const result = useRecipientItem(mockOrder)

    // Test the actual hook result structure
    expect(result).toHaveLength(1)

    const item = result[0]

    // Verify it's a LabelValueItem by checking required properties
    expect(item).toHaveProperty('label')
    expect(item).toHaveProperty('render')

    // Type guard to verify structure
    const isLabelValueItem = (obj: unknown): obj is { label: string; render: () => React.ReactNode } => {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        'label' in obj &&
        'render' in obj &&
        typeof (obj as { label: unknown }).label === 'string' &&
        typeof (obj as { render: unknown }).render === 'function'
      )
    }

    expect(isLabelValueItem(item)).toBe(true)

    if (isLabelValueItem(item)) {
      expect(item.label).toBe('Recipient')
      expect(() => item.render()).not.toThrow()
    }
  })

  it('should use useMemo for optimization', () => {
    const owner = '0x1234567890123456789012345678901234567890'
    const receiver = '0x9876543210987654321098765432109876543210'
    const mockOrder = createMockOrder(receiver, owner)

    useRecipientItem(mockOrder)

    expect(mockUseMemo).toHaveBeenCalled()
    expect(mockUseMemo).toHaveBeenCalledWith(expect.any(Function), [
      mockOrder.receiver,
      mockOrder.owner,
      expect.any(Function),
    ])
  })
})
