import { SafeAppFeatures, SafeAppAccessPolicyTypes } from '@safe-global/store/gateway/types'
import { type SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import SafeAppPreviewDrawer from '@/components/safe-apps/SafeAppPreviewDrawer'
import { render, screen, waitFor } from '@/tests/test-utils'

jest.mock('@/features/multichain', () => ({
  NetworkLogosTooltip: ({ networks, maxVisible }: { networks: { chainId: string }[]; maxVisible?: number }) => (
    <div>
      <div
        data-testid="network-logos-list"
        data-networks={networks.map((n) => n.chainId).join(',')}
        data-max-visible={maxVisible}
      />
      {networks.map((n) => (
        <div key={n.chainId} data-testid="chain-indicator">
          {n.chainId}
        </div>
      ))}
    </div>
  ),
}))

const mockUseChains = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => mockUseChains(),
  useChain: () => undefined,
  useCurrentChain: () => undefined,
  useHasFeature: () => undefined,
}))

const KNOWN_CHAIN_IDS = ['1', '10', '56', '100', '137']

beforeEach(() => {
  mockUseChains.mockReturnValue({ configs: KNOWN_CHAIN_IDS.map((chainId) => ({ chainId })) })
})

const safeAppMock: SafeAppData = {
  id: 24,
  url: 'https://safe-apps.dev.5afe.dev/tx-builder',
  name: 'Transaction Builder',
  iconUrl: 'https://safe-apps.dev.5afe.dev/tx-builder/tx-builder.png',
  description: 'A Safe app to compose custom transactions',
  chainIds: ['1', '10', '56', '100', '137'],
  provider: undefined,
  accessControl: {
    type: SafeAppAccessPolicyTypes.DomainAllowlist,
    value: ['https://safe.global'],
  },
  tags: ['transaction-builder'],
  features: [SafeAppFeatures.BATCHED_TRANSACTIONS],
  socialProfiles: [],
  developerWebsite: '',
  featured: false,
}

describe('SafeAppPreviewDrawer', () => {
  it('renders the available networks section as a collapsed logo cluster', async () => {
    render(<SafeAppPreviewDrawer isOpen safeApp={safeAppMock} onClose={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Available networks')).toBeInTheDocument()
    })

    const logos = screen.getByTestId('network-logos-list')
    expect(logos).toHaveAttribute('data-networks', safeAppMock.chainIds.join(','))
    expect(logos).toHaveAttribute('data-max-visible', '3')
  })

  it('passes every chain to the cluster so overflow collapses beyond the visible limit', async () => {
    render(<SafeAppPreviewDrawer isOpen safeApp={safeAppMock} onClose={jest.fn()} />)

    const logos = await screen.findByTestId('network-logos-list')
    expect(logos.getAttribute('data-networks')?.split(',')).toHaveLength(safeAppMock.chainIds.length)
  })

  it('lists all chains in the tooltip content', async () => {
    render(<SafeAppPreviewDrawer isOpen safeApp={safeAppMock} onClose={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getAllByTestId('chain-indicator')).toHaveLength(safeAppMock.chainIds.length)
    })
    expect(screen.getAllByTestId('chain-indicator').map((el) => el.textContent)).toEqual(safeAppMock.chainIds)
  })

  it('renders an empty cluster when the app has no networks', async () => {
    render(<SafeAppPreviewDrawer isOpen safeApp={{ ...safeAppMock, chainIds: [] }} onClose={jest.fn()} />)

    const logos = await screen.findByTestId('network-logos-list')
    expect(logos).toHaveAttribute('data-networks', '')
  })

  it('hides chains not recognized by the current environment', async () => {
    render(
      <SafeAppPreviewDrawer isOpen safeApp={{ ...safeAppMock, chainIds: ['1', '999999', '10'] }} onClose={jest.fn()} />,
    )

    const logos = await screen.findByTestId('network-logos-list')
    expect(logos).toHaveAttribute('data-networks', '1,10')
  })

  it('renders an empty cluster when none of the app chains are recognized', async () => {
    mockUseChains.mockReturnValue({ configs: [] })
    render(<SafeAppPreviewDrawer isOpen safeApp={safeAppMock} onClose={jest.fn()} />)

    const logos = await screen.findByTestId('network-logos-list')
    expect(logos).toHaveAttribute('data-networks', '')
  })
})
