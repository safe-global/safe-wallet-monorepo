import { faker } from '@faker-js/faker'
import { getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { Interface } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { renderWithUserEvent, waitFor } from '@/tests/test-utils'
import { mockCurrentChain, mockHasFeature, mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import { safeTxContextBuilder } from '@/tests/builders/safeTxContext'
import { COULD_NOT_SUBMIT_RETRY_MESSAGE } from '@/components/tx/TxSubmitError'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { dispatchRecoveryExecution } from '@/features/recovery/services'
import { seedRecoveryScenario } from '@/features/recovery/test-helpers'
import { RecoveryFeature, type RecoveryQueueItem } from '@/features/recovery'
import useGasPrice from '@/hooks/useGasPrice'
import useChains from '@/hooks/useChains'
import RecoveryAttemptReview from './RecoveryAttemptReview'

jest.mock('@/features/recovery/services', () => ({
  ...jest.requireActual('@/features/recovery/services'),
  dispatchRecoveryExecution: jest.fn(),
}))
jest.mock('@/features/recovery/hooks/useIsValidRecoveryExecution', () => ({
  useIsValidRecoveryExecuteNextTx: () => [true, undefined, false],
  useIsValidRecoverySkipExpired: () => [true, undefined, false],
}))
jest.mock('@/hooks/useGasPrice')
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

const GAS_PRICE = { maxFeePerGas: BigInt(20), maxPriorityFeePerGas: BigInt(2) }
const mockDispatch = jest.mocked(dispatchRecoveryExecution)

const ownerAddress = () => checksumAddress(faker.finance.ethereumAddress())

const swapOwnerProposal = (oldOwner: string, newOwner: string): RecoveryQueueItem => {
  const item = seedRecoveryScenario('executable')
  const safeAbi = getSafeSingletonDeployment({ version: '1.4.1' })!.abi
  const data = new Interface(safeAbi).encodeFunctionData('swapOwner', [ownerAddress(), oldOwner, newOwner])
  return { ...item, args: { ...item.args, data } } as RecoveryQueueItem
}

const renderReview = (item: RecoveryQueueItem) => {
  const setTxFlow = jest.fn()
  const txModal: TxModalContextType = { txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }
  const safeTxContext = safeTxContextBuilder().build()

  const result = renderWithUserEvent(
    <TxModalContext.Provider value={txModal}>
      <SafeTxContext.Provider value={safeTxContext}>
        <RecoveryAttemptReview item={item} />
      </SafeTxContext.Provider>
    </TxModalContext.Provider>,
  )

  return { ...result, setTxFlow, safeTxContext }
}

describe('RecoveryAttemptReview', () => {
  const oldOwner = ownerAddress()
  const newOwner = ownerAddress()
  let chainId: string

  beforeAll(async () => {
    await RecoveryFeature.load()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    chainId = mockSafeInfo({ version: '1.4.1', threshold: 1, owners: [{ value: oldOwner }] }).chainId
    const chain = mockCurrentChain({ chainId, features: [FEATURES.EIP1559] })
    jest.mocked(useChains).mockReturnValue({ configs: [chain], loading: false })
    mockHasFeature({ [FEATURES.RECOVERY]: true })
    jest.mocked(useGasPrice).mockReturnValue([GAS_PRICE, undefined, false])
    mockDispatch.mockResolvedValue(undefined)
  })

  it('shows the initiator and the signers the recovery adds, without a note field', async () => {
    mockRole('owner')
    const item = swapOwnerProposal(oldOwner, newOwner)

    const { findByText, getByText, getByRole, queryByTestId } = renderReview(item)

    expect(getByText('Execute this transaction to finalize the recovery.')).toBeInTheDocument()
    expect(getByText('Initiator')).toBeInTheDocument()
    expect(getByText(shortenAddress(item.executor))).toBeInTheDocument()
    expect(await findByText('Add signer(s):')).toBeInTheDocument()
    expect(getByText(newOwner)).toBeInTheDocument()
    expect(getByText('1 out of 1 owner(s)')).toBeInTheDocument()
    expect(getByRole('button', { name: 'Execute' })).toBeEnabled()
    expect(queryByTestId('tx-note-textfield')).not.toBeInTheDocument()
  })

  it('does not ask for a nonce', () => {
    mockRole('owner')

    const { safeTxContext } = renderReview(swapOwnerProposal(oldOwner, newOwner))

    expect(safeTxContext.setNonceNeeded).toHaveBeenCalledWith(false)
  })

  it('recommends to cancel a malicious proposal', async () => {
    mockRole('owner')
    const item = { ...swapOwnerProposal(oldOwner, newOwner), isMalicious: true }

    const { findByText, queryByText } = renderReview(item)

    expect(
      await findByText('This transaction potentially calls malicious actions. We recommend cancelling it.'),
    ).toBeInTheDocument()
    expect(queryByText('Add signer(s):')).not.toBeInTheDocument()
  })

  it('warns that the proposal will fail when the owner it replaces is gone', async () => {
    mockRole('owner')
    const item = swapOwnerProposal(ownerAddress(), newOwner)
    mockSafeInfo({ chainId, version: '1.4.1', threshold: 1, owners: [] })

    const { findByText } = renderReview(item)

    expect(await findByText(/This recovery proposal will fail/)).toBeInTheDocument()
  })

  it('executes the proposal on the Delay modifier with EIP-1559 fees and closes the flow', async () => {
    const wallet = mockRole('nonOwner')!
    const item = swapOwnerProposal(oldOwner, newOwner)

    const { getByRole, setTxFlow, user } = renderReview(item)
    await user.click(getByRole('button', { name: 'Execute' }))

    await waitFor(() => expect(setTxFlow).toHaveBeenCalledWith(undefined))
    expect(mockDispatch).toHaveBeenCalledWith({
      provider: wallet.provider,
      chainId,
      args: item.args,
      delayModifierAddress: item.address,
      signerAddress: wallet.address,
      overrides: { maxFeePerGas: '20', maxPriorityFeePerGas: '2' },
    })
  })

  it('sends a legacy gas price on a chain without EIP-1559', async () => {
    mockRole('owner')
    mockCurrentChain({ chainId, features: [] })

    const { getByRole, setTxFlow, user } = renderReview(swapOwnerProposal(oldOwner, newOwner))
    await user.click(getByRole('button', { name: 'Execute' }))

    await waitFor(() => expect(setTxFlow).toHaveBeenCalledWith(undefined))
    expect(mockDispatch.mock.calls[0][0].overrides).toEqual({ gasPrice: '20' })
  })

  it('keeps the flow open and shows the error when the execution fails', async () => {
    mockRole('owner')
    mockDispatch.mockRejectedValue(new Error('timeout'))

    const { getByRole, findByText, setTxFlow, user } = renderReview(swapOwnerProposal(oldOwner, newOwner))
    await user.click(getByRole('button', { name: 'Execute' }))

    expect(await findByText(COULD_NOT_SUBMIT_RETRY_MESSAGE)).toBeInTheDocument()
    expect(setTxFlow).not.toHaveBeenCalled()
  })

  it('disables Execute while no wallet is connected', () => {
    mockRole('disconnected')

    const { getByRole } = renderReview(swapOwnerProposal(oldOwner, newOwner))

    expect(getByRole('button', { name: 'Execute' })).toBeDisabled()
  })
})
