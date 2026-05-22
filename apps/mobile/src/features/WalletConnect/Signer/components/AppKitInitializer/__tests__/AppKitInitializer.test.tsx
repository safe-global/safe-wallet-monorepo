import React from 'react'
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { createTestStore } from '@/src/tests/test-utils'
import { AppKitInitializer } from '../AppKitInitializer'
import { cgwChainsToReownNetworks } from '@/src/features/WalletConnect/Signer/utils/chains'
import { createAppKitInstance } from '@/src/features/WalletConnect/Signer/appKit'
import { selectAllChains, selectActiveChain } from '@/src/store/chains'

jest.mock('@/src/features/WalletConnect/Signer/utils/chains', () => ({
  cgwChainsToReownNetworks: jest.fn(),
}))

jest.mock('@/src/features/WalletConnect/Signer/appKit', () => ({
  createAppKitInstance: jest.fn().mockReturnValue({}),
}))

jest.mock('@/src/store/chains', () => ({
  selectAllChains: jest.fn().mockReturnValue([]),
  selectActiveChain: jest.fn().mockReturnValue(null),
}))

jest.mock('@/src/features/WalletConnect/Signer/context/WalletConnectContext', () => {
  const { Text: RNText } = require('react-native')
  const RN = require('react')

  return {
    WalletConnectProvider: ({ children, instance }: { children: React.ReactNode; instance: unknown }) =>
      RN.createElement(
        RN.Fragment,
        null,
        RN.createElement(RNText, { testID: 'instance' }, JSON.stringify(instance)),
        children,
      ),
  }
})

const mockSelectAllChains = selectAllChains as unknown as jest.Mock
const mockSelectActiveChain = selectActiveChain as unknown as jest.Mock
const mockCgwChainsToReownNetworks = cgwChainsToReownNetworks as jest.Mock
const mockCreateAppKitInstance = createAppKitInstance as jest.Mock

const ethereumNetwork = { id: 1, name: 'Ethereum', chainNamespace: 'eip155' as const }
const polygonNetwork = { id: 137, name: 'Polygon', chainNamespace: 'eip155' as const }

function renderAppKitInitializer() {
  const store = createTestStore()

  return render(
    <Provider store={store}>
      <AppKitInitializer>
        <Text testID="child">Child content</Text>
      </AppKitInitializer>
    </Provider>,
  )
}

describe('AppKitInitializer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSelectAllChains.mockReturnValue([])
    mockSelectActiveChain.mockReturnValue(null)
    mockCgwChainsToReownNetworks.mockReturnValue([])
    mockCreateAppKitInstance.mockReturnValue({ mock: 'appkit' })
  })

  it('defers initialization when no chains are available', () => {
    mockCgwChainsToReownNetworks.mockReturnValue([])

    const { getByTestId } = renderAppKitInitializer()

    expect(getByTestId('child')).toBeTruthy()
    expect(mockCreateAppKitInstance).not.toHaveBeenCalled()
    expect(getByTestId('instance').props.children).toBe('null')
  })

  it('renders children within WalletConnectProvider when chains are present', () => {
    mockSelectActiveChain.mockReturnValue({ chainId: '1' })
    mockCgwChainsToReownNetworks.mockReturnValue([ethereumNetwork])

    const { getByTestId } = renderAppKitInitializer()

    expect(getByTestId('child')).toBeTruthy()
    expect(getByTestId('instance')).toBeTruthy()
  })

  it('converts CGW chains to Reown networks', () => {
    const chains = [{ chainId: '1' }, { chainId: '137' }]
    mockSelectAllChains.mockReturnValue(chains)
    mockSelectActiveChain.mockReturnValue({ chainId: '1' })
    mockCgwChainsToReownNetworks.mockReturnValue([ethereumNetwork, polygonNetwork])

    renderAppKitInitializer()

    expect(mockCgwChainsToReownNetworks).toHaveBeenCalledWith(chains)
  })

  it('calls createAppKitInstance with converted networks', () => {
    mockSelectActiveChain.mockReturnValue({ chainId: '1' })
    mockCgwChainsToReownNetworks.mockReturnValue([ethereumNetwork, polygonNetwork])

    renderAppKitInitializer()

    expect(mockCreateAppKitInstance).toHaveBeenCalledWith([ethereumNetwork, polygonNetwork], ethereumNetwork)
  })

  it('sets defaultNetwork to active chain when available', () => {
    mockSelectActiveChain.mockReturnValue({ chainId: '137' })
    mockCgwChainsToReownNetworks.mockReturnValue([ethereumNetwork, polygonNetwork])

    renderAppKitInitializer()

    expect(mockCreateAppKitInstance).toHaveBeenCalledWith([ethereumNetwork, polygonNetwork], polygonNetwork)
  })

  it('passes undefined as defaultNetwork when active chain is not in networks', () => {
    mockSelectActiveChain.mockReturnValue({ chainId: '999' })
    mockCgwChainsToReownNetworks.mockReturnValue([ethereumNetwork])

    renderAppKitInitializer()

    expect(mockCreateAppKitInstance).toHaveBeenCalledWith([ethereumNetwork], undefined)
  })

  it('falls back to first network as default when no active chain', () => {
    mockSelectActiveChain.mockReturnValue(null)
    mockCgwChainsToReownNetworks.mockReturnValue([ethereumNetwork, polygonNetwork])

    renderAppKitInitializer()

    expect(mockCreateAppKitInstance).toHaveBeenCalledWith([ethereumNetwork, polygonNetwork], ethereumNetwork)
  })

  it('passes the AppKit instance to WalletConnectProvider', () => {
    mockSelectActiveChain.mockReturnValue({ chainId: '1' })
    mockCgwChainsToReownNetworks.mockReturnValue([ethereumNetwork])
    mockCreateAppKitInstance.mockReturnValue({ mock: 'appkit-instance' })

    const { getByTestId } = renderAppKitInitializer()

    expect(getByTestId('instance').props.children).toBe(JSON.stringify({ mock: 'appkit-instance' }))
  })
})
