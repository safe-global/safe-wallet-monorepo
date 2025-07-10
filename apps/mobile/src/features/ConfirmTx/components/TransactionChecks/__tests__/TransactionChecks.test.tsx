import React from 'react'
import { render, userEvent } from '@/src/tests/test-utils'
import { TransactionChecks } from '../TransactionChecks'
import { useTransactionSecurity } from '../hooks/useTransactionSecurity'
import { useRouter } from 'expo-router'

type SecurityHookReturn = ReturnType<typeof useTransactionSecurity>

interface MockSafeListItemProps {
  onPress: () => void
  leftNode: React.ReactNode
  label: string
  rightNode: React.ReactNode
  bottomContent?: React.ReactNode
}

interface MockTransactionChecksLeftNodeProps {
  security: SecurityHookReturn
}

interface MockTransactionChecksBottomContentProps {
  security: SecurityHookReturn
}

// Mock the dependencies
jest.mock('../hooks/useTransactionSecurity')
jest.mock('expo-router')
jest.mock('@/src/components/SafeListItem', () => {
  const React = require('react')
  const { Pressable, View, Text } = require('react-native')
  return {
    SafeListItem: ({ onPress, leftNode, label, rightNode, bottomContent }: MockSafeListItemProps) =>
      React.createElement(
        Pressable,
        { testID: 'safe-list-item', onPress },
        React.createElement(View, { testID: 'left-node' }, leftNode),
        React.createElement(Text, { testID: 'label' }, label),
        React.createElement(View, { testID: 'right-node' }, rightNode),
        bottomContent && React.createElement(View, { testID: 'bottom-content' }, bottomContent),
      ),
  }
})
jest.mock('../components/TransactionChecksLeftNode', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    TransactionChecksLeftNode: ({ security }: MockTransactionChecksLeftNodeProps) =>
      React.createElement(View, {
        testID: 'transaction-checks-left-node',
        accessibilityLabel: security.isScanning ? 'scanning' : 'idle',
      }),
  }
})
jest.mock('../components/TransactionChecksBottomContent', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    TransactionChecksBottomContent: ({ security }: MockTransactionChecksBottomContentProps) =>
      security.hasIssues || security.hasContractManagement || security.error
        ? React.createElement(View, { testID: 'transaction-checks-bottom-content' })
        : null,
  }
})

const mockUseTransactionSecurity = jest.mocked(useTransactionSecurity)
const mockUseRouter = jest.mocked(useRouter)

describe('TransactionChecks', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    const mockRouter = {
      push: mockPush,
    }
    mockUseRouter.mockReturnValue(mockRouter as never)
  })

  const createSecurityState = (overrides: Partial<SecurityHookReturn> = {}): SecurityHookReturn => ({
    enabled: true,
    isScanning: false,
    hasError: false,
    payload: undefined,
    error: undefined,
    isHighRisk: false,
    isMediumRisk: false,
    hasWarnings: false,
    hasIssues: false,
    hasContractManagement: false,
    ...overrides,
  })

  it('should render with correct label when not scanning', () => {
    const security = createSecurityState()
    mockUseTransactionSecurity.mockReturnValue(security)

    const { getByTestId } = render(<TransactionChecks txId="test-tx-id" />)

    expect(getByTestId('label')).toHaveTextContent('Transaction checks')
  })

  it('should render with scanning label when scanning', () => {
    const security = createSecurityState({ isScanning: true })
    mockUseTransactionSecurity.mockReturnValue(security)

    const { getByTestId } = render(<TransactionChecks txId="test-tx-id" />)

    expect(getByTestId('label')).toHaveTextContent('Checking transaction...')
  })

  it('should render left node with security state', () => {
    const security = createSecurityState({ isScanning: true })
    mockUseTransactionSecurity.mockReturnValue(security)

    const { getByTestId } = render(<TransactionChecks txId="test-tx-id" />)

    const leftNode = getByTestId('transaction-checks-left-node')
    expect(leftNode.props.accessibilityLabel).toBe('scanning')
  })

  it('should render bottom content when security has issues', () => {
    const security = createSecurityState({ hasIssues: true })
    mockUseTransactionSecurity.mockReturnValue(security)

    const { getByTestId } = render(<TransactionChecks txId="test-tx-id" />)

    expect(getByTestId('transaction-checks-bottom-content')).toBeTruthy()
  })

  it('should render bottom content when contract management detected', () => {
    const security = createSecurityState({ hasContractManagement: true })
    mockUseTransactionSecurity.mockReturnValue(security)

    const { getByTestId } = render(<TransactionChecks txId="test-tx-id" />)

    expect(getByTestId('transaction-checks-bottom-content')).toBeTruthy()
  })

  it('should render bottom content when security error exists', () => {
    const security = createSecurityState({ error: new Error('Test error') })
    mockUseTransactionSecurity.mockReturnValue(security)

    const { getByTestId } = render(<TransactionChecks txId="test-tx-id" />)

    expect(getByTestId('transaction-checks-bottom-content')).toBeTruthy()
  })

  it('should not render bottom content when no issues', () => {
    const security = createSecurityState()
    mockUseTransactionSecurity.mockReturnValue(security)

    const { queryByTestId } = render(<TransactionChecks txId="test-tx-id" />)

    expect(queryByTestId('transaction-checks-bottom-content')).toBeFalsy()
  })

  it('should navigate to transaction checks page on press', async () => {
    const user = userEvent.setup()
    const security = createSecurityState()
    mockUseTransactionSecurity.mockReturnValue(security)

    const { getByTestId } = render(<TransactionChecks txId="test-tx-123" />)

    await user.press(getByTestId('safe-list-item'))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/transaction-checks',
      params: { txId: 'test-tx-123' },
    })
  })

  it('should pass txDetails to useTransactionSecurity hook', () => {
    const txDetails = { txId: 'test-tx', txInfo: {} } as Parameters<typeof useTransactionSecurity>[0]
    const security = createSecurityState()
    mockUseTransactionSecurity.mockReturnValue(security)

    render(<TransactionChecks txId="test-tx-id" txDetails={txDetails} />)

    expect(mockUseTransactionSecurity).toHaveBeenCalledWith(txDetails)
  })

  it('should handle undefined txDetails', () => {
    const security = createSecurityState()
    mockUseTransactionSecurity.mockReturnValue(security)

    render(<TransactionChecks txId="test-tx-id" />)

    expect(mockUseTransactionSecurity).toHaveBeenCalledWith(undefined)
  })

  it('should not render bottomContent if security is disabled', () => {
    const security = createSecurityState({ enabled: false, hasIssues: true })
    mockUseTransactionSecurity.mockReturnValue(security)

    const { queryByTestId } = render(<TransactionChecks txId="test-tx-id" />)

    const bottomContent = queryByTestId('transaction-checks-bottom-content')
    expect(bottomContent).toBeNull()
  })
})
