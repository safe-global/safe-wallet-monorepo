import { render, screen, waitFor } from '@/tests/test-utils'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import SafeShieldWidget from './index'
import * as useChains from '@/hooks/useChains'
import { type SafeTransaction } from '@safe-global/types-kit'
import { FETCH_STATUS } from '@safe-global/utils/components/tx/security/tenderly/types'

// Mock the hooks
jest.mock('@/hooks/useChains')
jest.mock('@safe-global/utils/components/tx/security/tenderly/utils', () => ({
  isTxSimulationEnabled: jest.fn(() => true),
  getSimulationStatus: jest.fn(() => ({
    isLoading: false,
    isFinished: false,
    isSuccess: false,
    isCallTraceError: false,
    isError: false,
  })),
}))

describe('SafeShieldWidget', () => {
  const mockChain = {
    chainId: '1',
    chainName: 'Ethereum',
    shortName: 'eth',
  }

  const mockSafeTx = {
    data: {
      to: '0x123',
      value: '0',
      data: '0x',
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x000',
      refundReceiver: '0x000',
      nonce: 0,
    },
  } as SafeTransaction

  const mockTxInfoContext = {
    simulation: {
      simulateTransaction: jest.fn(),
      simulationData: undefined,
      _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
      simulationLink: '',
      requestError: undefined,
      resetSimulation: jest.fn(),
    },
    status: {
      isLoading: false,
      isFinished: false,
      isSuccess: false,
      isCallTraceError: false,
      isError: false,
    },
    nestedTx: {
      simulation: {
        simulateTransaction: jest.fn(),
        simulationData: undefined,
        _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
        simulationLink: '',
        requestError: undefined,
        resetSimulation: jest.fn(),
      },
      status: {
        isLoading: false,
        isFinished: false,
        isSuccess: false,
        isCallTraceError: false,
        isError: false,
      },
    },
  }

  beforeEach(() => {
    ;(useChains.useCurrentChain as jest.Mock).mockReturnValue(mockChain)
  })

  it('renders the safe shield widget with security checks', () => {
    const mockSafeTxContext = {
      safeTx: undefined,
      safeTxError: undefined,
      setSafeTx: jest.fn(),
      setSafeTxError: jest.fn(),
    }

    render(
      <SafeTxContext.Provider value={mockSafeTxContext}>
        <TxInfoContext.Provider value={mockTxInfoContext}>
          <SafeShieldWidget />
        </TxInfoContext.Provider>
      </SafeTxContext.Provider>,
    )

    // Check if the header is present
    expect(screen.getByText('checks passed')).toBeInTheDocument()

    // Check if the Secured by Safe section is rendered
    expect(screen.getByText('Secured by')).toBeInTheDocument()
  })

  it('renders simulation check with Run button when transaction is available', () => {
    const mockSafeTxContext = {
      safeTx: mockSafeTx,
      safeTxError: undefined,
      setSafeTx: jest.fn(),
      setSafeTxError: jest.fn(),
    }

    render(
      <SafeTxContext.Provider value={mockSafeTxContext}>
        <TxInfoContext.Provider value={mockTxInfoContext}>
          <SafeShieldWidget />
        </TxInfoContext.Provider>
      </SafeTxContext.Provider>,
    )

    // Check if simulation check and Run button are present
    expect(screen.getByText('Transaction simulation')).toBeInTheDocument()
    expect(screen.getByText('Run')).toBeInTheDocument()
  })

  it('shows loading state during simulation', () => {
    const mockSafeTxContext = {
      safeTx: mockSafeTx,
      safeTxError: undefined,
      setSafeTx: jest.fn(),
      setSafeTxError: jest.fn(),
    }

    const loadingTxInfoContext = {
      ...mockTxInfoContext,
      status: {
        ...mockTxInfoContext.status,
        isLoading: true,
      },
    }

    render(
      <SafeTxContext.Provider value={mockSafeTxContext}>
        <TxInfoContext.Provider value={loadingTxInfoContext}>
          <SafeShieldWidget />
        </TxInfoContext.Provider>
      </SafeTxContext.Provider>,
    )

    // Check if loading state shows "Running..." text
    expect(screen.getByText('Running...')).toBeInTheDocument()
  })

  it('shows success message after successful simulation', async () => {
    const mockSafeTxContext = {
      safeTx: mockSafeTx,
      safeTxError: undefined,
      setSafeTx: jest.fn(),
      setSafeTxError: jest.fn(),
    }

    const successTxInfoContext = {
      ...mockTxInfoContext,
      simulation: {
        ...mockTxInfoContext.simulation,
        simulationLink: 'https://tenderly.co/simulation/123',
      },
      status: {
        ...mockTxInfoContext.status,
        isFinished: true,
        isSuccess: true,
      },
    }

    render(
      <SafeTxContext.Provider value={mockSafeTxContext}>
        <TxInfoContext.Provider value={successTxInfoContext}>
          <SafeShieldWidget />
        </TxInfoContext.Provider>
      </SafeTxContext.Provider>,
    )

    // Check if success message is displayed with "Transaction simulations" (plural)
    expect(screen.getByText('Transaction simulations')).toBeInTheDocument()

    // Check if success message text is displayed
    await waitFor(() => {
      expect(screen.getByText('Simulation successful.')).toBeInTheDocument()
    })
  })

  it('shows error message after failed simulation', async () => {
    const mockSafeTxContext = {
      safeTx: mockSafeTx,
      safeTxError: undefined,
      setSafeTx: jest.fn(),
      setSafeTxError: jest.fn(),
    }

    const errorTxInfoContext = {
      ...mockTxInfoContext,
      status: {
        ...mockTxInfoContext.status,
        isFinished: true,
        isError: true,
        isSuccess: false,
      },
      simulation: {
        ...mockTxInfoContext.simulation,
        simulationLink: 'https://tenderly.co/simulation/456',
        simulationData: {
          transaction: {
            error_message: 'Execution reverted',
            error_info: { address: '0xabc' },
          },
        },
      },
    }

    render(
      <SafeTxContext.Provider value={mockSafeTxContext}>
        <TxInfoContext.Provider value={errorTxInfoContext}>
          <SafeShieldWidget />
        </TxInfoContext.Provider>
      </SafeTxContext.Provider>,
    )

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Simulation failed.')).toBeInTheDocument()
    })
  })
})
