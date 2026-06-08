import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { ConnectionPermissionsPanel } from '../ConnectionPermissionsPanel'

describe('ConnectionPermissionsPanel', () => {
  it('shows the verified banner and hides the trust warning when verified', () => {
    const { getByText, queryByText } = renderWithStore(
      <ConnectionPermissionsPanel variant="verified" onDismiss={jest.fn()} />,
      createTestStore(),
    )
    expect(getByText('This domain has been verified.')).toBeTruthy()
    expect(queryByText('Only continue if you trust the source.')).toBeNull()
  })

  it('shows the unverified banner and the trust warning', () => {
    const { getByText } = renderWithStore(
      <ConnectionPermissionsPanel variant="unverified" onDismiss={jest.fn()} />,
      createTestStore(),
    )
    expect(getByText('This domain could not be verified.')).toBeTruthy()
    expect(getByText('Only continue if you trust the source.')).toBeTruthy()
  })

  it('shows the scam banner and the trust warning when malicious', () => {
    const { getByText } = renderWithStore(
      <ConnectionPermissionsPanel variant="malicious" onDismiss={jest.fn()} />,
      createTestStore(),
    )
    expect(getByText('This domain is flagged as a known scam.')).toBeTruthy()
    expect(getByText('Only continue if you trust the source.')).toBeTruthy()
  })

  // Guards against a regression: `$successBackground` is not a real theme token, so the
  // verified banner used to resolve to no background. The valid token is `$backgroundSuccess`.
  it.each(['verified', 'unverified', 'malicious'] as const)('renders the %s banner with a background colour', (v) => {
    const { getByTestId } = renderWithStore(
      <ConnectionPermissionsPanel variant={v} onDismiss={jest.fn()} />,
      createTestStore(),
    )
    const style = getByTestId('wc-permissions-banner').props.style
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat(Infinity).filter(Boolean)) : style
    expect(flat.backgroundColor).toBeTruthy()
  })

  it('calls onDismiss when "Got it" is pressed', () => {
    const onDismiss = jest.fn()
    const { getByTestId } = renderWithStore(
      <ConnectionPermissionsPanel variant="verified" onDismiss={onDismiss} />,
      createTestStore(),
    )
    fireEvent.press(getByTestId('wc-proposal-permissions-dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
