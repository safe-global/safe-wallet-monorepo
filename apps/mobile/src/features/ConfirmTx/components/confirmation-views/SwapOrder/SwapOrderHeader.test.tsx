import React from 'react'
import { render } from '@/src/tests/test-utils'
import { SwapOrderHeader } from './SwapOrderHeader'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { MultisigExecutionDetails, TokenInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Mock the date utils
jest.mock('@/src/utils/date', () => ({
  formatWithSchema: jest.fn((timestamp: number, format: string) => {
    const date = new Date(timestamp)
    if (format === 'MMM d yyyy') {
      return 'Dec 25 2023'
    }
    if (format === 'hh:mm a') {
      return '10:30 AM'
    }
    return date.toISOString()
  }),
}))

// Mock the formatters
jest.mock('@/src/utils/formatters', () => ({
  formatValue: jest.fn((_amount: string, _decimals: number) => '100.5'),
  ellipsis: jest.fn((text: string, length: number) => (text.length > length ? `${text.slice(0, length)}...` : text)),
}))

// Mock the TokenIcon component
jest.mock('@/src/components/TokenIcon', () => ({
  TokenIcon: ({ accessibilityLabel }: { logoUri: string; accessibilityLabel: string }) => {
    const React = require('react')
    const { View, Text } = require('react-native')
    return React.createElement(
      View,
      { testID: `token-icon-${accessibilityLabel}` },
      React.createElement(Text, null, accessibilityLabel),
    )
  },
}))

// Mock the SafeFontIcon component
jest.mock('@/src/components/SafeFontIcon', () => ({
  SafeFontIcon: ({ name }: { name: string }) => {
    const React = require('react')
    const { View, Text } = require('react-native')
    return React.createElement(View, { testID: `safe-font-icon-${name}` }, React.createElement(Text, null, name))
  },
}))

describe('SwapOrderHeader', () => {
  const mockSellToken: TokenInfo = {
    address: '0x123',
    decimals: 18,
    logoUri: 'https://example.com/eth.png',
    name: 'Ethereum',
    symbol: 'ETH',
    trusted: true,
  }

  const mockBuyToken: TokenInfo = {
    address: '0x456',
    decimals: 6,
    logoUri: 'https://example.com/usdc.png',
    name: 'USD Coin',
    symbol: 'USDC',
    trusted: true,
  }

  const mockExecutionInfo: MultisigExecutionDetails = {
    type: 'MULTISIG',
    submittedAt: 1703505000000, // Dec 25 2023 10:30 AM
    nonce: 1,
    safeTxGas: '100000',
    baseGas: '21000',
    gasPrice: '20000000000',
    gasToken: '0x0',
    refundReceiver: {
      value: '0x789',
      name: 'Refund Receiver',
      logoUri: null,
    },
    safeTxHash: '0xabc123',
    executor: null,
    signers: [],
    confirmationsRequired: 2,
    confirmations: [],
    rejectors: [],
    gasTokenInfo: null,
    trusted: true,
    proposer: null,
    proposedByDelegate: null,
  }

  const createMockTxInfo = (kind: 'sell' | 'buy'): OrderTransactionInfo => ({
    type: 'SwapOrder' as const,
    humanDescription: 'Swap order',
    uid: 'test-uid',
    status: 'open' as const,
    kind,
    orderClass: 'market' as const,
    validUntil: 1703591400,
    sellAmount: '1000000000000000000', // 1 ETH in wei
    buyAmount: '1500000000', // 1500 USDC (6 decimals)
    executedSellAmount: '0',
    executedBuyAmount: '0',
    sellToken: mockSellToken,
    buyToken: mockBuyToken,
    explorerUrl: 'https://explorer.com/order/test-uid',
    executedFee: '0',
    executedFeeToken: '0x0',
    receiver: null,
    owner: '0x123',
    fullAppData: null,
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Sell Order', () => {
    it('should render sell order with correct labels', () => {
      const sellOrderTxInfo = createMockTxInfo('sell')
      const { getByText } = render(<SwapOrderHeader txInfo={sellOrderTxInfo} executionInfo={mockExecutionInfo} />)

      // Check date and time display
      expect(getByText('Dec 25 2023 at 10:30 AM')).toBeTruthy()

      // Check sell order specific labels
      expect(getByText('Sell')).toBeTruthy()
      expect(getByText('For at least')).toBeTruthy()

      // Check token amounts are displayed
      expect(getByText('100.5 ETH')).toBeTruthy()
      expect(getByText('100.5 USDC')).toBeTruthy()
    })

    it('should render token icons with correct accessibility labels', () => {
      const sellOrderTxInfo = createMockTxInfo('sell')
      const { getByTestId } = render(<SwapOrderHeader txInfo={sellOrderTxInfo} executionInfo={mockExecutionInfo} />)

      expect(getByTestId('token-icon-ETH')).toBeTruthy()
      expect(getByTestId('token-icon-USDC')).toBeTruthy()
    })

    it('should render chevron icon', () => {
      const sellOrderTxInfo = createMockTxInfo('sell')
      const { getByTestId } = render(<SwapOrderHeader txInfo={sellOrderTxInfo} executionInfo={mockExecutionInfo} />)

      expect(getByTestId('safe-font-icon-chevron-right')).toBeTruthy()
    })
  })

  describe('Buy Order', () => {
    it('should render buy order with correct labels', () => {
      const buyOrderTxInfo = createMockTxInfo('buy')
      const { getByText } = render(<SwapOrderHeader txInfo={buyOrderTxInfo} executionInfo={mockExecutionInfo} />)

      // Check date and time display
      expect(getByText('Dec 25 2023 at 10:30 AM')).toBeTruthy()

      // Check buy order specific labels
      expect(getByText('For at most')).toBeTruthy()
      expect(getByText('Buy exactly')).toBeTruthy()

      // Check token amounts are displayed
      expect(getByText('100.5 ETH')).toBeTruthy()
      expect(getByText('100.5 USDC')).toBeTruthy()
    })

    it('should not show sell order labels for buy orders', () => {
      const buyOrderTxInfo = createMockTxInfo('buy')
      const { queryByText } = render(<SwapOrderHeader txInfo={buyOrderTxInfo} executionInfo={mockExecutionInfo} />)

      // Sell order labels should not be present
      expect(queryByText('Sell')).toBeNull()
      expect(queryByText('For at least')).toBeNull()
    })
  })

  describe('Unknown Order Kind', () => {
    it('should handle unknown order kind gracefully', () => {
      const unknownOrderTxInfo = createMockTxInfo('sell')
      unknownOrderTxInfo.kind = 'unknown' as 'buy' | 'sell' | 'unknown'

      const { getByText } = render(<SwapOrderHeader txInfo={unknownOrderTxInfo} executionInfo={mockExecutionInfo} />)

      // Should default to buy order labels when kind is 'unknown'
      expect(getByText('For at most')).toBeTruthy()
      expect(getByText('Buy exactly')).toBeTruthy()
    })
  })

  describe('Formatters Integration', () => {
    it('should call formatValue with correct parameters', () => {
      const sellOrderTxInfo = createMockTxInfo('sell')
      const { formatValue } = require('@/src/utils/formatters')

      render(<SwapOrderHeader txInfo={sellOrderTxInfo} executionInfo={mockExecutionInfo} />)

      expect(formatValue).toHaveBeenCalledWith('1000000000000000000', 18) // ETH
      expect(formatValue).toHaveBeenCalledWith('1500000000', 6) // USDC
    })

    it('should call ellipsis with correct parameters', () => {
      const sellOrderTxInfo = createMockTxInfo('sell')
      const { ellipsis } = require('@/src/utils/formatters')

      render(<SwapOrderHeader txInfo={sellOrderTxInfo} executionInfo={mockExecutionInfo} />)

      expect(ellipsis).toHaveBeenCalledWith('100.5', 9)
    })

    it('should call formatWithSchema with correct parameters', () => {
      const sellOrderTxInfo = createMockTxInfo('sell')
      const { formatWithSchema } = require('@/src/utils/date')

      render(<SwapOrderHeader txInfo={sellOrderTxInfo} executionInfo={mockExecutionInfo} />)

      expect(formatWithSchema).toHaveBeenCalledWith(1703505000000, 'MMM d yyyy')
      expect(formatWithSchema).toHaveBeenCalledWith(1703505000000, 'hh:mm a')
    })
  })
})
