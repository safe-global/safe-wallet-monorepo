import React from 'react'
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { createTestStore } from '@/src/tests/test-utils'
import { AppKitInitializer } from '../AppKitInitializer'
import { cgwChainsToReownNetworks } from '@/src/features/WalletConnect/utils/chains'
import { createAppKitInstance, FALLBACK_NETWORKS } from '@/src/features/WalletConnect/appKit'
import { selectAllChains, selectActiveChain } from '@/src/store/chains'

jest.mock('@/src/features/WalletConnect/utils/chains', () => ({
  cgwChainsToReownNetworks: jest.fn(),
}))

jest.mock('@/src/features/WalletConnect/appKit', () => ({
  createAppKitInstance: jest.fn().mockReturnValue({}),
  FALLBACK_NETWORKS: [{ id: 1, name: 'Ethereum' }],
}))

jest.mock('@/src/store/chains', () => ({
  selectAllChains: jest.fn().mockReturnValue([]),
  selectActiveChain: jest.fn().mockReturnValue(null),
}))

jest.mock('@/src/features/WalletConnect/context/WalletConnectContext', () => {
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

  it('creates instance with fallback networks when no active chain', () => {
    mockSelectActiveChain.mockReturnValue(null)
    mockCgwChainsToReownNetworks.mockReturnValue([])

    const { getByTestId } = renderAppKitInitializer()

    expect(getByTestId('child')).toBeTruthy()
    expect(mockCreateAppKitInstance).toHaveBeenCalledWith(FALLBACK_NETWORKS, FALLBACK_NETWORKS[0])
  })

  it('renders children within WalletConnectProvider when active chain is present', () => {
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

  it('uses FALLBACK_NETWORKS when no chains are available', () => {
    mockSelectActiveChain.mockReturnValue({ chainId: '1' })
    mockCgwChainsToReownNetworks.mockReturnValue([])

    renderAppKitInitializer()

    expect(mockCreateAppKitInstance).toHaveBeenCalledWith(FALLBACK_NETWORKS, undefined)
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

  it('passes the AppKit instance to WalletConnectProvider', () => {
    mockSelectActiveChain.mockReturnValue({ chainId: '1' })
    mockCgwChainsToReownNetworks.mockReturnValue([ethereumNetwork])
    mockCreateAppKitInstance.mockReturnValue({ mock: 'appkit-instance' })

    const { getByTestId } = renderAppKitInitializer()

    expect(getByTestId('instance').props.children).toBe(JSON.stringify({ mock: 'appkit-instance' }))
  })
})
