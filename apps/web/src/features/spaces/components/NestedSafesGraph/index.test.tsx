import { render, screen } from '@/tests/test-utils'
import NestedSafesGraph from './index'

jest.mock('./GraphCanvas', () => ({
  __esModule: true,
  default: ({ apiNodes }: { apiNodes: unknown[] }) => (
    <div data-testid="graph-canvas" data-node-count={apiNodes.length} />
  ),
}))

const mockUseGraphQuery = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetNestedSafesGraphV1Query: (...args: unknown[]) => mockUseGraphQuery(...args),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => 'space-uuid',
  useSpaceSafes: () => ({ allSafes: [{ address: '0xA', chainId: '1' }], isLoading: false }),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: () => ({ chainId: '1', chainName: 'Ethereum' }),
  default: () => ({ configs: [{ chainId: '1', chainName: 'Ethereum' }] }),
}))

describe('NestedSafesGraph page', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows a loading state while the graph query is loading', () => {
    mockUseGraphQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<NestedSafesGraph />)
    expect(screen.getByTestId('graph-loading')).toBeInTheDocument()
  })

  it('renders the canvas with returned nodes', async () => {
    mockUseGraphQuery.mockReturnValue({
      data: {
        chainId: '1',
        nodes: [{ address: '0xA', name: null, isSpaceMember: true, trust: 'trusted' }],
        edges: [],
        truncated: false,
        depthReached: 0,
      },
      isLoading: false,
      isError: false,
    })
    render(<NestedSafesGraph />)
    // GraphCanvas is loaded via next/dynamic (ssr:false), so it resolves async.
    expect(await screen.findByTestId('graph-canvas')).toHaveAttribute('data-node-count', '1')
  })

  it('shows a truncation banner when truncated', () => {
    mockUseGraphQuery.mockReturnValue({
      data: { chainId: '1', nodes: [], edges: [], truncated: true, depthReached: 6 },
      isLoading: false,
      isError: false,
    })
    render(<NestedSafesGraph />)
    expect(screen.getByTestId('graph-truncation-banner')).toBeInTheDocument()
  })

  it('shows an error state when the query errors', () => {
    mockUseGraphQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<NestedSafesGraph />)
    expect(screen.getByText('Failed to load the nested Safes graph. Please try again.')).toBeInTheDocument()
  })
})
