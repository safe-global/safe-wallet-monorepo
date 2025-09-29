import React from 'react'
import { render } from '@/src/tests/test-utils'
import { TransactionChecksLeftNode } from '../TransactionChecksLeftNode'
import { SecurityState } from '../../utils/transactionChecksUtils'

interface MockSafeFontIconProps {
  name: string
  testID?: string
}

interface MockCircleSnailProps {
  size: number
  borderWidth?: number
  thickness?: number
}

// Mock the external components
jest.mock('@/src/components/SafeFontIcon', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    SafeFontIcon: ({ name, testID = 'safe-font-icon' }: MockSafeFontIconProps) =>
      React.createElement(View, { testID, accessibilityLabel: name }),
  }
})

jest.mock('react-native-progress', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    CircleSnail: ({ size }: MockCircleSnailProps) =>
      React.createElement(View, { testID: 'circle-snail', accessibilityLabel: `spinner-${size}` }),
  }
})

describe('TransactionChecksLeftNode', () => {
  const createSecurityState = (overrides: Partial<SecurityState> = {}): SecurityState => ({
    hasError: false,
    isMediumRisk: false,
    isHighRisk: false,
    hasContractManagement: false,
    isScanning: false,
    enabled: true,
    hasIssues: false,
    hasWarnings: false,
    error: undefined,
    payload: null,
    ...overrides,
  })

  it('should render CircleSnail when scanning', () => {
    const security = createSecurityState({ isScanning: true })
    const { getByTestId } = render(<TransactionChecksLeftNode security={security} />)

    const spinner = getByTestId('circle-snail')
    expect(spinner).toBeTruthy()
  })

  it('should render shield icon by default', () => {
    const security = createSecurityState()
    const { getByTestId } = render(<TransactionChecksLeftNode security={security} />)

    const icon = getByTestId('safe-font-icon')
    expect(icon).toBeTruthy()
    expect(icon.props.accessibilityLabel).toBe('shield')
  })

  it('should render shield-crossed icon when hasError', () => {
    const security = createSecurityState({ hasError: true })
    const { getByTestId } = render(<TransactionChecksLeftNode security={security} />)

    const icon = getByTestId('safe-font-icon')
    expect(icon.props.accessibilityLabel).toBe('shield-crossed')
  })

  it('should render alert-triangle icon when isMediumRisk', () => {
    const security = createSecurityState({ isMediumRisk: true })
    const { getByTestId } = render(<TransactionChecksLeftNode security={security} />)

    const icon = getByTestId('safe-font-icon')
    expect(icon.props.accessibilityLabel).toBe('alert-triangle')
  })

  it('should render alert-triangle icon when hasContractManagement', () => {
    const security = createSecurityState({ hasContractManagement: true })
    const { getByTestId } = render(<TransactionChecksLeftNode security={security} />)

    const icon = getByTestId('safe-font-icon')
    expect(icon.props.accessibilityLabel).toBe('alert-triangle')
  })

  it('should prioritize scanning state over icon state', () => {
    const security = createSecurityState({
      isScanning: true,
      hasError: true,
      isMediumRisk: true,
    })
    const { getByTestId, queryByTestId } = render(<TransactionChecksLeftNode security={security} />)

    expect(getByTestId('circle-snail')).toBeTruthy()
    expect(queryByTestId('safe-font-icon')).toBeFalsy()
  })
})
