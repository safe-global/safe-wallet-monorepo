import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('@/features/multichain', () => ({
  useAddNetworkState: jest.fn(),
}))
jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  OVERVIEW_EVENTS: {
    ADD_NEW_NETWORK: { action: 'Add new network', category: 'overview' },
    SHOW_ALL_NETWORKS: { action: 'Show all networks', category: 'overview' },
  },
  OVERVIEW_LABELS: { top_bar: 'top_bar' },
}))
jest.mock('../ChainLogo', () => ({
  __esModule: true,
  default: ({ chainId }: { chainId: string }) => <span data-testid="chain-logo" data-chain-id={chainId} />,
}))

import { useAddNetworkState } from '@/features/multichain'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import AllNetworksSection from '../AllNetworksSection'

const mockHook = useAddNetworkState as jest.Mock
const mockTrack = trackEvent as jest.Mock

describe('AllNetworksSection', () => {
  beforeEach(() => jest.resetAllMocks())

  it('renders nothing when the feature is disabled on the current chain', () => {
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [],
      unavailableReason: null,
      isFeatureEnabled: false,
    })

    const { container } = render(
      <AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the "not possible for this Safe" message for the safe-specific reason', () => {
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [],
      unavailableReason: 'safe-specific',
      isFeatureEnabled: true,
    })

    render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)

    expect(screen.getByTestId('chain-selector-unavailable')).toBeInTheDocument()
    expect(screen.getByText('Adding another network is not possible for this Safe.')).toBeInTheDocument()
  })

  it('wraps the Info icon in a tooltip trigger when a raw error message is available', () => {
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [],
      unavailableReason: 'safe-specific',
      error: new Error('The method this Safe was created with is not supported.'),
      isFeatureEnabled: true,
    })

    render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)

    expect(screen.getByTestId('chain-selector-unavailable-tooltip')).toBeInTheDocument()
  })

  it('does not render a tooltip trigger when there is no raw error message', () => {
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [],
      unavailableReason: 'outdated-mastercopy',
      isFeatureEnabled: true,
    })

    render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)

    expect(screen.queryByTestId('chain-selector-unavailable-tooltip')).not.toBeInTheDocument()
  })

  it('shows the outdated-mastercopy message when the reason is outdated-mastercopy', () => {
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [],
      unavailableReason: 'outdated-mastercopy',
      isFeatureEnabled: true,
    })

    render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)

    expect(
      screen.getByText('This account was created from an outdated mastercopy. Adding another network is not possible.'),
    ).toBeInTheDocument()
  })

  it('shows a loader while the creation data is being fetched', () => {
    mockHook.mockReturnValue({
      loading: true,
      availableNetworks: [],
      unavailableReason: null,
      isFeatureEnabled: true,
    })

    render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)

    expect(screen.getByTestId('chain-selector-loading')).toBeInTheDocument()
  })

  it('renders nothing when there are no available networks and no error', () => {
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [],
      unavailableReason: null,
      isFeatureEnabled: true,
    })

    const { container } = render(
      <AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the "All networks" accordion trigger when there are available networks', () => {
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [
        { chainId: '10', chainName: 'Optimism', available: true },
        { chainId: '137', chainName: 'Polygon', available: true },
      ],
      unavailableReason: null,
      isFeatureEnabled: true,
    })

    render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)

    expect(screen.getByText('All networks')).toBeInTheDocument()
  })

  it('exposes an add button per chain once the accordion is expanded', () => {
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [
        { chainId: '10', chainName: 'Optimism', available: true },
        { chainId: '137', chainName: 'Polygon', available: true },
      ],
      unavailableReason: null,
      isFeatureEnabled: true,
    })

    render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)
    fireEvent.click(screen.getByText('All networks'))

    expect(screen.getByLabelText('Add Optimism')).toBeEnabled()
    expect(screen.getByLabelText('Add Polygon')).toBeEnabled()
  })

  it('calls onAddNetwork with the clicked chainId for an available chain', () => {
    const onAddNetwork = jest.fn()
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [{ chainId: '10', chainName: 'Optimism', available: true }],
      unavailableReason: null,
      isFeatureEnabled: true,
    })

    render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={onAddNetwork} />)
    fireEvent.click(screen.getByText('All networks'))
    fireEvent.click(screen.getByLabelText('Add Optimism'))

    expect(onAddNetwork).toHaveBeenCalledWith('10')
  })

  it('marks a chain as disabled and shows "Not available" when available=false', () => {
    const onAddNetwork = jest.fn()
    mockHook.mockReturnValue({
      loading: false,
      availableNetworks: [{ chainId: '324', chainName: 'zkSync', available: false }],
      unavailableReason: null,
      isFeatureEnabled: true,
    })

    render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={onAddNetwork} />)
    fireEvent.click(screen.getByText('All networks'))

    const button = screen.getByLabelText('Add zkSync')
    expect(button).toBeDisabled()
    expect(screen.getByText('Not available')).toBeInTheDocument()

    fireEvent.click(button)
    expect(onAddNetwork).not.toHaveBeenCalled()
  })

  describe('analytics', () => {
    beforeEach(() => {
      mockHook.mockReturnValue({
        loading: false,
        availableNetworks: [{ chainId: '10', chainName: 'Optimism', available: true }],
        unavailableReason: null,
        isFeatureEnabled: true,
      })
    })

    it('fires SHOW_ALL_NETWORKS when the accordion is expanded', () => {
      render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)
      fireEvent.click(screen.getByText('All networks'))

      expect(mockTrack).toHaveBeenCalledWith(OVERVIEW_EVENTS.SHOW_ALL_NETWORKS)
    })

    it('does not fire SHOW_ALL_NETWORKS when the accordion is collapsed again', () => {
      render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)
      fireEvent.click(screen.getByText('All networks'))
      mockTrack.mockClear()
      fireEvent.click(screen.getByText('All networks'))

      expect(mockTrack).not.toHaveBeenCalled()
    })

    it('fires ADD_NEW_NETWORK with top_bar label when a chain is clicked', () => {
      render(<AllNetworksSection safeAddress="0xSafe" deployedChainIds={['1']} onAddNetwork={jest.fn()} />)
      fireEvent.click(screen.getByText('All networks'))
      fireEvent.click(screen.getByLabelText('Add Optimism'))

      expect(mockTrack).toHaveBeenCalledWith({ ...OVERVIEW_EVENTS.ADD_NEW_NETWORK, label: OVERVIEW_LABELS.top_bar })
    })
  })
})
