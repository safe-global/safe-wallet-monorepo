import React from 'react'
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { WalletKitGate } from '../WalletKitGate'

const mockUseHasFeature = jest.fn()
jest.mock('@/src/hooks/useHasFeature', () => ({ useHasFeature: () => mockUseHasFeature() }))

// Tag the mocked provider so tests can assert whether it was mounted.
jest.mock('../WalletKitProvider', () => {
  const { Text: RNText } = jest.requireActual('react-native')
  return {
    WalletKitProvider: () => <RNText>provider-mounted</RNText>,
  }
})

describe('WalletKitGate', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders only children when the feature flag is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const { queryByText, getByText } = render(
      <WalletKitGate>
        <Text>child</Text>
      </WalletKitGate>,
    )
    expect(getByText('child')).toBeTruthy()
    expect(queryByText('provider-mounted')).toBeNull()
  })

  it('mounts the provider when the feature flag is on', () => {
    mockUseHasFeature.mockReturnValue(true)
    const { getByText } = render(
      <WalletKitGate>
        <Text>child</Text>
      </WalletKitGate>,
    )
    expect(getByText('provider-mounted')).toBeTruthy()
    expect(getByText('child')).toBeTruthy()
  })

  it('treats an undefined flag (no active safe) as off', () => {
    mockUseHasFeature.mockReturnValue(undefined)
    const { queryByText, getByText } = render(
      <WalletKitGate>
        <Text>child</Text>
      </WalletKitGate>,
    )
    expect(getByText('child')).toBeTruthy()
    expect(queryByText('provider-mounted')).toBeNull()
  })

  // Regression for the onboarding bounce: importing the first Safe flips the flag
  // false -> true. Children (the navigation tree) must survive that flip without
  // remounting, or in-flight navigation is discarded and the user lands back on
  // the landing screen. A mount effect fires once per mount, so the spy count
  // staying at 1 proves the subtree was not torn down and rebuilt.
  it('does not remount children when the feature flag flips on', () => {
    const onMount = jest.fn()
    const Child = () => {
      React.useEffect(() => {
        onMount()
      }, [])
      return <Text>child</Text>
    }

    mockUseHasFeature.mockReturnValue(false)
    const { rerender, getByText, queryByText } = render(
      <WalletKitGate>
        <Child />
      </WalletKitGate>,
    )
    expect(onMount).toHaveBeenCalledTimes(1)
    expect(queryByText('provider-mounted')).toBeNull()

    mockUseHasFeature.mockReturnValue(true)
    rerender(
      <WalletKitGate>
        <Child />
      </WalletKitGate>,
    )

    expect(getByText('provider-mounted')).toBeTruthy()
    // Child is still on screen (the gate renders it directly, not inside the provider)
    // and its mount effect never fired a second time: same instance, no remount.
    expect(getByText('child')).toBeTruthy()
    expect(onMount).toHaveBeenCalledTimes(1)
  })
})
