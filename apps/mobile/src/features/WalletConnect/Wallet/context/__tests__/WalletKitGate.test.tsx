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
})
