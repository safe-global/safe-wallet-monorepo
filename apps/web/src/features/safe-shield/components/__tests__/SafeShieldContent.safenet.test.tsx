import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { SafeShieldContent } from '../SafeShieldContent'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { buildBenignSnapshot, buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import * as useChainsModule from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SafeTransaction } from '@safe-global/types-kit'

// The real Safenet feature chunk mounts inside the widget; simulation rows are isolated below.
// A missing feature.tsx registry member cannot be caught by the stubbed widget test.
jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

jest.mock('../TenderlySimulation', () => ({
  TenderlySimulation: () => <div data-testid="tenderly-simulation" />,
}))
jest.mock('../TenderlySimulationLocked', () => ({
  TenderlySimulationLocked: () => <div data-testid="tenderly-simulation-locked" />,
}))
jest.mock('../../hooks/useHasOwnTenderly', () => ({ useHasOwnTenderly: () => false }))

const HASH = `0x${'ef'.repeat(32)}`
const TX_ID = `multisig_0x0000000000000000000000000000000000000123_${HASH}`

const emptyAnalysis: [undefined, undefined, boolean] = [undefined, undefined, false]
const safeTx = {
  data: { to: '0x00000000000000000000000000000000000000aa', value: '0', data: '0x', operation: 0 },
} as unknown as SafeTransaction

describe('SafeShieldContent Safenet section integration', () => {
  let hasFeatureSpy: jest.SpyInstance
  beforeAll(() => {
    hasFeatureSpy = jest
      .spyOn(useChainsModule, 'useHasFeature')
      .mockImplementation((feature) => feature === FEATURES.SAFENET_CHECKS)
  })
  afterAll(() => {
    hasFeatureSpy.mockRestore()
  })

  const txDetails = {
    detailedExecutionInfo: { type: DetailedExecutionInfoType.MULTISIG, submittedAt: 1_700_000_000_000 },
  } as unknown as TransactionDetails

  const renderContent = (props: { hasProFeatures?: boolean; isSafePro?: boolean } = {}) =>
    renderWithUserEvent(
      <TxFlowContext.Provider value={{ txId: TX_ID, txDetails } as TxFlowContextType}>
        <SafeShieldContent
          recipient={emptyAnalysis}
          contract={emptyAnalysis}
          threat={emptyAnalysis}
          deadlock={emptyAnalysis}
          safeTx={safeTx}
          {...props}
        />
      </TxFlowContext.Provider>,
    )

  it('shows locked Safenet education in the Pro section without Pro features', async () => {
    const mocked = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>
    mocked.mockReturnValue(buildCheckView())
    const { user } = renderContent({ hasProFeatures: false })

    await waitFor(() => expect(screen.getByTestId('safenet-checks-locked')).toBeInTheDocument(), { timeout: 10_000 })
    expect(screen.getByTestId('pro-checks-section')).toContainElement(screen.getByTestId('safenet-checks-locked'))
    expect(screen.queryByRole('link', { name: /Learn more/ })).not.toBeInTheDocument()
    await user.hover(screen.getByLabelText('About Safenet check'))
    const tooltip = (await screen.findByRole('link', { name: /Learn more/ })).closest('[data-slot=tooltip-content]')
    expect(tooltip).toHaveTextContent('The check starts after you sign.')
    expect(screen.getByRole('link', { name: /Learn more/ })).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-checks-section')).not.toBeInTheDocument()
  })

  it('shows the check among the open checks when Safe Pro is off', async () => {
    const mocked = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>
    mocked.mockReturnValue(
      buildCheckView({
        snapshot: buildBenignSnapshot({ safeTxHash: HASH as `0x${string}` }),
        status: CheckStatus.BENIGN,
        publicStatus: CheckStatus.BENIGN,
      }),
    )

    renderContent({ isSafePro: false })

    await waitFor(() => expect(screen.getByTestId('safenet-checks-section')).toBeInTheDocument(), {
      timeout: 10_000,
    })
    expect(screen.getByTestId('open-checks-list')).toContainElement(screen.getByTestId('safenet-checks-section'))
    expect(screen.queryByTestId('pro-checks-section')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safenet-checks-locked')).not.toBeInTheDocument()
  }, 15_000)

  it.each([
    ['Pro rollout off', { isSafePro: false, hasProFeatures: false }, 'tenderly-simulation', 'safenet-checks-section'],
    ['active Pro plan', { isSafePro: true, hasProFeatures: true }, 'tenderly-simulation', 'safenet-checks-section'],
    ['no plan', { isSafePro: true, hasProFeatures: false }, 'tenderly-simulation-locked', 'safenet-checks-locked'],
  ])(
    'places Safenet after transaction simulation with %s',
    async (_name, props, simulationId, safenetId) => {
      const mocked = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>
      mocked.mockReturnValue(
        buildCheckView({
          snapshot: buildBenignSnapshot({ safeTxHash: HASH as `0x${string}` }),
          status: CheckStatus.BENIGN,
          publicStatus: CheckStatus.BENIGN,
        }),
      )
      renderContent(props)

      const safenet = await screen.findByTestId(safenetId, {}, { timeout: 10_000 })
      const simulation = screen.getByTestId(simulationId)
      expect(simulation.compareDocumentPosition(safenet) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(simulation.parentElement).toBe(safenet.parentElement)
    },
    15_000,
  )

  it('renders the check section through the lazy feature for a flow with a txId', async () => {
    const mocked = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>
    mocked.mockReturnValue(
      buildCheckView({
        snapshot: buildBenignSnapshot({ safeTxHash: HASH as `0x${string}` }),
        status: CheckStatus.BENIGN,
        publicStatus: CheckStatus.BENIGN,
      }),
    )
    renderContent()

    // The testid alone distinguishes the real mount from the null stub. Cold
    // CI runners can take seconds to transform the chunk's module graph.
    await waitFor(() => expect(screen.getByTestId('safenet-checks-section')).toBeInTheDocument(), {
      timeout: 10_000,
    })
    expect(screen.getByTestId('pro-checks-section')).toContainElement(screen.getByTestId('safenet-checks-section'))
  }, 15_000)
})
