import { render, screen } from '@/tests/test-utils'
import { TenderlySimulationLocked } from '../TenderlySimulationLocked'

const mockUseCurrentChain = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: () => mockUseCurrentChain() }))

describe('TenderlySimulationLocked', () => {
  beforeEach(() => mockUseCurrentChain.mockReturnValue({ chainId: '1', features: ['TX_SIMULATION'] }))

  it('shows the locked row with no way to run or open a simulation', () => {
    render(<TenderlySimulationLocked />)

    expect(screen.getByTestId('tenderly-simulation-locked')).toHaveTextContent('Transaction simulation')
    expect(screen.queryByTestId('run-simulation-btn')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders nothing on a chain without simulation', () => {
    mockUseCurrentChain.mockReturnValue({ chainId: '1', features: [] })
    expect(render(<TenderlySimulationLocked />).container).toBeEmptyDOMElement()
  })
})
