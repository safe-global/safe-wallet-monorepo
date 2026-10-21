import { renderWithUserEvent } from '@/tests/test-utils'
import { mockCurrentChain, mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole, type TestRole } from '@/tests/mocks/roles'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { RecoveryAttemptFlow } from '@/components/tx-flow/flows'
import ExecuteRecoveryButton from '.'
import { useClock } from '../../hooks/useClock'
import { NOW, seedRecoveryScenario, type RecoveryScenarioName } from '../../test-helpers'
import type { RecoveryQueueItem } from '../../services/recovery-state'

jest.mock('../../hooks/useClock')
jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')
jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

const REVIEW_WINDOW_REASON = 'You can execute the recovery after the specified review window'
const PREVIOUS_PROPOSALS_REASON = 'Previous recovery proposals must be executed or cancelled first'

const setTxFlow = jest.fn()

const renderButton = (recovery: RecoveryQueueItem) => {
  const txModal: TxModalContextType = { txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }

  return renderWithUserEvent(
    <TxModalContext.Provider value={txModal}>
      <ExecuteRecoveryButton recovery={recovery} />
    </TxModalContext.Provider>,
  )
}

describe('ExecuteRecoveryButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useClock).mockReturnValue(NOW)
    mockSafeInfo({ deployed: true })
    mockCurrentChain({ chainName: 'Sepolia' })
  })

  it.each<[RecoveryScenarioName, TestRole]>([
    ['executable', 'owner'],
    ['executable', 'nonOwner'],
    ['executableWithoutExpiry', 'owner'],
  ])('lets the %s proposal be executed by an %s', async (scenario, role) => {
    mockRole(role)
    const recovery = seedRecoveryScenario(scenario)

    const { getByRole, user } = renderButton(recovery)
    await user.click(getByRole('button', { name: 'Execute' }))

    expect(setTxFlow).toHaveBeenCalledWith(<RecoveryAttemptFlow item={recovery} />)
  })

  it.each<[RecoveryScenarioName, string]>([
    ['waiting', REVIEW_WINDOW_REASON],
    ['expired', REVIEW_WINDOW_REASON],
    ['processing', REVIEW_WINDOW_REASON],
    ['notNext', PREVIOUS_PROPOSALS_REASON],
  ])('disables a %s proposal and explains: %s', async (scenario, reason) => {
    mockRole('owner')
    const recovery = seedRecoveryScenario(scenario)

    const { getByRole, findByText, user } = renderButton(recovery)
    const button = getByRole('button', { name: 'Execute' })
    await user.hover(button)

    expect(button).toBeDisabled()
    expect(await findByText(reason)).toBeInTheDocument()
  })

  it('asks to switch the network when the wallet is on another chain', async () => {
    mockRole('wrongChain')
    const recovery = seedRecoveryScenario('executable')

    const { getByRole, findByText, user } = renderButton(recovery)
    const button = getByRole('button', { name: 'Execute' })
    await user.hover(button)

    expect(button).toBeDisabled()
    expect(await findByText('Switch your wallet network to Sepolia to execute this transaction')).toBeInTheDocument()
  })

  it('is disabled while no wallet is connected', () => {
    mockRole('disconnected')
    const recovery = seedRecoveryScenario('executable')

    const { getByRole } = renderButton(recovery)

    expect(getByRole('button', { name: 'Execute' })).toBeDisabled()
  })
})
