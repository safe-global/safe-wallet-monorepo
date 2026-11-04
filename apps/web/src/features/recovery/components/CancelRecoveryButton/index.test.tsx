import { renderWithUserEvent, waitFor } from '@/tests/test-utils'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole, type TestRole } from '@/tests/mocks/roles'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { CancelRecoveryFlow } from '@/components/tx-flow/flows'
import { trackError, Errors } from '@/services/exceptions'
import { RecoveryListItemContext } from '@safe-global/views/features/recovery/components/RecoveryListItem/RecoveryListItemContext'
import CancelRecoveryButton from '.'
import { useClock } from '../../hooks/useClock'
import { dispatchRecoverySkipExpired } from '../../services/recovery-sender'
import { NOW, seedRecoveryScenario, type RecoveryScenarioName } from '../../test-helpers'
import type { RecoveryQueueItem } from '../../services/recovery-state'

jest.mock('../../hooks/useClock')
jest.mock('../../services/recovery-sender')
jest.mock('@/services/analytics')
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  trackError: jest.fn(),
}))
jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

const setTxFlow = jest.fn()
const setSubmitError = jest.fn()

const renderButton = (recovery: RecoveryQueueItem) => {
  const txModal: TxModalContextType = { txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }

  return renderWithUserEvent(
    <TxModalContext.Provider value={txModal}>
      <RecoveryListItemContext.Provider value={{ submitError: undefined, setSubmitError }}>
        <CancelRecoveryButton recovery={recovery} />
      </RecoveryListItemContext.Provider>
    </TxModalContext.Provider>,
  )
}

describe('CancelRecoveryButton', () => {
  let safe: ExtendedSafeInfo

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useClock).mockReturnValue(NOW)
    safe = mockSafeInfo({ deployed: true })
  })

  it.each<[TestRole, RecoveryScenarioName, boolean]>([
    ['owner', 'waiting', true],
    ['owner', 'executable', true],
    ['owner', 'notNext', true],
    ['owner', 'expired', true],
    ['owner', 'processing', false],
    ['owner', 'expiredProcessing', false],
    ['nonOwner', 'waiting', false],
    ['nonOwner', 'executable', false],
    ['nonOwner', 'expired', true],
    ['nonOwner', 'expiredProcessing', false],
    ['wrongChain', 'expired', false],
    ['disconnected', 'expired', false],
  ])('as %s, for a %s proposal, is enabled: %s', (role, scenario, isEnabled) => {
    mockRole(role)
    const recovery = seedRecoveryScenario(scenario)

    const { getByRole } = renderButton(recovery)

    expect(getByRole('button', { name: 'Cancel' })).toHaveProperty('disabled', !isEnabled)
  })

  it('lets an owner cancel the proposal with a Safe transaction', async () => {
    mockRole('owner')
    const recovery = seedRecoveryScenario('waiting')

    const { getByRole, user } = renderButton(recovery)
    await user.click(getByRole('button', { name: 'Cancel' }))

    expect(setTxFlow).toHaveBeenCalledWith(<CancelRecoveryFlow recovery={recovery} />)
    expect(dispatchRecoverySkipExpired).not.toHaveBeenCalled()
  })

  it('lets a non-owner cancel an expired proposal from the connected wallet', async () => {
    const wallet = mockRole('nonOwner')
    const recovery = seedRecoveryScenario('expired')

    const { getByRole, user } = renderButton(recovery)
    await user.click(getByRole('button', { name: 'Cancel' }))

    expect(dispatchRecoverySkipExpired).toHaveBeenCalledWith({
      provider: wallet?.provider,
      chainId: safe.chainId,
      delayModifierAddress: recovery.address,
      recoveryTxHash: recovery.args.txHash,
      signerAddress: wallet?.address,
    })
    expect(setTxFlow).not.toHaveBeenCalled()
    expect(setSubmitError).not.toHaveBeenCalled()
  })

  it('shows and reports the error when cancelling the expired proposal fails', async () => {
    const error = new Error('User rejected the request')
    jest.mocked(dispatchRecoverySkipExpired).mockRejectedValue(error)
    mockRole('nonOwner')
    const recovery = seedRecoveryScenario('expired')

    const { getByRole, user } = renderButton(recovery)
    await user.click(getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(setSubmitError).toHaveBeenCalledWith(error))
    expect(trackError).toHaveBeenCalledWith(Errors._813, error)
  })
})
