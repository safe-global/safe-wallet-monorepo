import { render, screen } from '@/tests/test-utils'
import { TenderlySimulationLocked } from '../TenderlySimulationLocked'

const mockUseCurrentChain = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: () => mockUseCurrentChain() }))

describe('TenderlySimulationLocked', () => {
  beforeEach(() => mockUseCurrentChain.mockReturnValue({ chainId: '1', features: ['TX_SIMULATION'] }))

  it('shows the locked row with a Set link to the environment variables of this Safe instead of a Run button', () => {
    render(<TenderlySimulationLocked />, { routerProps: { query: { safe: 'eth:0x1234' } } })

    expect(screen.getByTestId('tenderly-simulation-locked')).toHaveTextContent('Transaction simulation')
    expect(screen.queryByTestId('run-simulation-btn')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set' })).toHaveAttribute(
      'href',
      '/settings/environment-variables?safe=eth%3A0x1234',
    )
  })

  it('renders nothing on a chain without simulation', () => {
    mockUseCurrentChain.mockReturnValue({ chainId: '1', features: [] })
    expect(render(<TenderlySimulationLocked />).container).toBeEmptyDOMElement()
  })
})
