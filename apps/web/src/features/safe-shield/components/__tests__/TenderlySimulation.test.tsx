import { screen, renderWithUserEvent } from '@/tests/test-utils'
import { TenderlySimulation } from '../TenderlySimulation'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import { FETCH_STATUS } from '@safe-global/utils/components/tx/security/tenderly/types'
import type { SimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'
import type { UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import * as useNestedTransactionHook from '../useNestedTransaction'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'

// The env-driven Tenderly check is off in tests; the feature flag itself is not under test here.
jest.mock('@safe-global/utils/components/tx/security/tenderly/utils', () => ({
  ...jest.requireActual('@safe-global/utils/components/tx/security/tenderly/utils'),
  isTxSimulationEnabled: () => true,
}))

jest.mock('@/hooks/wallets/useWallet', () => ({ useSigner: () => undefined }))
jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: () => true }))

const simulation = (link = ''): UseSimulationReturn => ({
  simulateTransaction: jest.fn(),
  simulationData: undefined,
  _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
  simulationLink: link,
  requestError: undefined,
  resetSimulation: jest.fn(),
})

const status = (isFinished: boolean): SimulationStatus => ({
  isLoading: false,
  isFinished,
  isSuccess: isFinished,
  isCallTraceError: false,
  isError: false,
})

const renderSimulation = ({
  isNested,
  isFinished,
  autoRun = false,
}: {
  isNested: boolean
  isFinished: boolean
  autoRun?: boolean
}) => {
  jest.spyOn(useNestedTransactionHook, 'useNestedTransaction').mockReturnValue({
    isNested,
    isNestedLoading: false,
    nestedSafeInfo: isNested ? ({ address: { value: '0x1' } } as unknown as SafeInfo) : undefined,
    nestedSafeTx: isNested ? safeTxBuilder().build() : undefined,
  })

  return renderWithUserEvent(
    <TxInfoContext.Provider
      value={{
        simulation: simulation('https://tenderly.example/main'),
        status: status(isFinished),
        nestedTx: { simulation: simulation('https://tenderly.example/nested'), status: status(isFinished) },
      }}
    >
      <TenderlySimulation safeTx={safeTxBuilder().build()} autoRun={autoRun} />
    </TxInfoContext.Provider>,
  )
}

describe('TenderlySimulation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ chainId: '11155111' }).build())
  })

  it('expands and collapses a finished nested simulation from the keyboard', async () => {
    const { user } = renderSimulation({ isNested: true, isFinished: true })

    const header = await screen.findByRole('button', { name: /Transaction simulations/ })

    await user.tab()
    expect(header).toHaveFocus()
    expect(header).toHaveAttribute('aria-expanded', 'false')

    await user.keyboard('{Enter}')
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Nested transaction simulation successful.')).toBeVisible()

    await user.keyboard(' ')
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps the finished nested header as a keyboard trigger under Safe Pro auto-run', async () => {
    const { user } = renderSimulation({ isNested: true, isFinished: true, autoRun: true })

    const header = await screen.findByRole('button', { name: /Transaction simulations/ })
    expect(screen.queryByTestId('run-simulation-btn')).not.toBeInTheDocument()

    await user.tab()
    expect(header).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Nested transaction simulation successful.')).toBeVisible()
  })

  it('does not make the header a tab stop while the simulation can not expand', async () => {
    const { user } = renderSimulation({ isNested: true, isFinished: false })

    const runButton = await screen.findByTestId('run-simulation-btn')
    expect(screen.queryByRole('button', { name: /Transaction simulation$/ })).not.toBeInTheDocument()

    await user.tab()
    expect(runButton).toHaveFocus()
  })
})
