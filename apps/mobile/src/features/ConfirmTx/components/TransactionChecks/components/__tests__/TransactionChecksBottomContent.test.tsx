import React from 'react'
import { render } from '@/src/tests/test-utils'
import { TransactionChecksBottomContent } from '../TransactionChecksBottomContent'
import { SecurityState } from '../../utils/transactionChecksUtils'
import { AlertType } from '@/src/components/Alert'

interface MockAlertProps {
  type: AlertType
  info?: string
  message: string
}

// Mock the Alert component
jest.mock('@/src/components/Alert', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  return {
    Alert: ({ type, info, message }: MockAlertProps) =>
      React.createElement(
        View,
        { testID: 'alert', accessibilityLabel: `${type}-alert` },
        info && React.createElement(Text, { testID: 'alert-info' }, info),
        React.createElement(Text, { testID: 'alert-message' }, message),
      ),
  }
})

describe('TransactionChecksBottomContent', () => {
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

  it('should render nothing when security is disabled', () => {
    const security = createSecurityState({ enabled: false, hasIssues: true })
    const { queryByTestId } = render(<TransactionChecksBottomContent security={security} />)

    expect(queryByTestId('alert')).toBeFalsy()
  })

  it('should render nothing when no conditions are met', () => {
    const security = createSecurityState()
    const { queryByTestId } = render(<TransactionChecksBottomContent security={security} />)

    expect(queryByTestId('alert')).toBeFalsy()
  })

  it('should render error alert for high risk issues', () => {
    const security = createSecurityState({
      hasIssues: true,
      isHighRisk: true,
    })
    const { getByTestId } = render(<TransactionChecksBottomContent security={security} />)

    const alert = getByTestId('alert')
    expect(alert.props.accessibilityLabel).toBe('error-alert')
    expect(getByTestId('alert-info')).toHaveTextContent('Potential risk detected')
    expect(getByTestId('alert-message')).toHaveTextContent('Review details before signing')
  })

  it('should render warning alert for medium risk issues', () => {
    const security = createSecurityState({
      hasIssues: true,
      isMediumRisk: true,
    })
    const { getByTestId } = render(<TransactionChecksBottomContent security={security} />)

    const alert = getByTestId('alert')
    expect(alert.props.accessibilityLabel).toBe('warning-alert')
    expect(getByTestId('alert-info')).toHaveTextContent('Potential risk detected')
    expect(getByTestId('alert-message')).toHaveTextContent('Review details before signing')
  })

  it('should render info alert for low risk issues', () => {
    const security = createSecurityState({ hasIssues: true })
    const { getByTestId } = render(<TransactionChecksBottomContent security={security} />)

    const alert = getByTestId('alert')
    expect(alert.props.accessibilityLabel).toBe('info-alert')
    expect(getByTestId('alert-info')).toHaveTextContent('Potential risk detected')
    expect(getByTestId('alert-message')).toHaveTextContent('Review details before signing')
  })

  it('should render contract management warning', () => {
    const security = createSecurityState({ hasContractManagement: true })
    const { getByTestId } = render(<TransactionChecksBottomContent security={security} />)

    const alert = getByTestId('alert')
    expect(alert.props.accessibilityLabel).toBe('warning-alert')
    expect(getByTestId('alert-info')).toHaveTextContent('Review details first')
    expect(getByTestId('alert-message')).toHaveTextContent('Contract changes detected!')
  })

  it('should render error alert when security check fails', () => {
    const security = createSecurityState({ error: new Error('Blockaid failed') })
    const { getByTestId } = render(<TransactionChecksBottomContent security={security} />)

    const alert = getByTestId('alert')
    expect(alert.props.accessibilityLabel).toBe('warning-alert')
    expect(getByTestId('alert-message')).toHaveTextContent('Proceed with caution')
    expect(getByTestId('alert-info')).toHaveTextContent(
      'The transaction could not be checked for security alerts. Verify the details and addresses before proceeding.',
    )
  })

  it('should prioritize security issues over contract management', () => {
    const security = createSecurityState({
      hasIssues: true,
      hasContractManagement: true,
      isMediumRisk: true,
    })
    const { getByTestId } = render(<TransactionChecksBottomContent security={security} />)

    const alert = getByTestId('alert')
    expect(alert.props.accessibilityLabel).toBe('warning-alert')
    expect(getByTestId('alert-info')).toHaveTextContent('Potential risk detected')
    expect(getByTestId('alert-message')).toHaveTextContent('Review details before signing')
  })

  it('should prioritize security issues over errors', () => {
    const security = createSecurityState({
      hasIssues: true,
      error: new Error('Test error'),
      isHighRisk: true,
    })
    const { getByTestId } = render(<TransactionChecksBottomContent security={security} />)

    const alert = getByTestId('alert')
    expect(alert.props.accessibilityLabel).toBe('error-alert')
    expect(getByTestId('alert-info')).toHaveTextContent('Potential risk detected')
  })

  it('should prioritize contract management over errors', () => {
    const security = createSecurityState({
      hasContractManagement: true,
      error: new Error('Test error'),
    })
    const { getByTestId } = render(<TransactionChecksBottomContent security={security} />)

    const alert = getByTestId('alert')
    expect(alert.props.accessibilityLabel).toBe('warning-alert')
    expect(getByTestId('alert-info')).toHaveTextContent('Review details first')
    expect(getByTestId('alert-message')).toHaveTextContent('Contract changes detected!')
  })
})
