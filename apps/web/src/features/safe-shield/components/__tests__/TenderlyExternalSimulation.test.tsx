import { render, screen } from '@/tests/test-utils'
import type { SafeTransaction } from '@safe-global/types-kit'
import { TenderlyExternalSimulation } from '../TenderlyExternalSimulation'

const mockUseCurrentChain = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: () => mockUseCurrentChain() }))
jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: () => '0x1234567890123456789012345678901234567890',
}))

const safeTx = {
  data: { to: '0x00000000000000000000000000000000000000aa', value: '1000', data: '0xa9059cbb', operation: 0 },
} as unknown as SafeTransaction

describe('TenderlyExternalSimulation', () => {
  beforeEach(() => mockUseCurrentChain.mockReturnValue({ chainId: '1', features: ['TX_SIMULATION'] }))

  it('hands the inner call to Tenderly public simulator instead of running it', () => {
    render(<TenderlyExternalSimulation safeTx={safeTx} />)

    expect(screen.getByText('Transaction simulation')).toBeInTheDocument()
    const link = screen.getByTestId('tenderly-external-link')
    const url = new URL(link.getAttribute('href') ?? '')
    expect(url.origin + url.pathname).toBe('https://dashboard.tenderly.co/simulator/new')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      network: '1',
      from: '0x1234567890123456789012345678901234567890',
      contractAddress: '0x00000000000000000000000000000000000000aa',
      value: '1000',
      rawFunctionInput: '0xa9059cbb',
    })
    expect(screen.queryByTestId('run-simulation-btn')).not.toBeInTheDocument()
  })

  it('renders nothing without a transaction or on a chain without simulation', () => {
    const { container, rerender } = render(<TenderlyExternalSimulation safeTx={undefined} />)
    expect(container).toBeEmptyDOMElement()

    mockUseCurrentChain.mockReturnValue({ chainId: '1', features: [] })
    rerender(<TenderlyExternalSimulation safeTx={safeTx} />)
    expect(container).toBeEmptyDOMElement()
  })
})
