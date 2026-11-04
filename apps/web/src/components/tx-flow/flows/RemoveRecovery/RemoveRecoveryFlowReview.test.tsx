import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { renderWithUserEvent, waitFor } from '@/tests/test-utils'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { safeTxContextBuilder } from '@/tests/builders/safeTxContext'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type { RecoveryStateItem } from '@/features/recovery'
import { createRemoveModuleTx } from '@/services/tx/tx-sender'
import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { RemoveRecoveryFlowReview } from './RemoveRecoveryFlowReview'

jest.mock('@/services/tx/tx-sender', () => ({ createRemoveModuleTx: jest.fn() }))
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children, onSubmit }: { children: ReactNode; onSubmit: () => void }) => (
    <>
      {children}
      <button onClick={onSubmit}>Continue</button>
    </>
  ),
}))

const mockCreateRemoveModuleTx = jest.mocked(createRemoveModuleTx)
const builtTx = safeTxBuilder().build()

const fakeAddress = () => checksumAddress(faker.finance.ethereumAddress())

const delayModifierWith = (recoverers: string[]): RecoveryStateItem => ({
  address: fakeAddress(),
  recoverers,
  expiry: BigInt(0),
  delay: BigInt(0),
  txNonce: BigInt(0),
  queueNonce: BigInt(0),
  queue: [],
})

const renderReview = (delayModifier: RecoveryStateItem) => {
  const context = safeTxContextBuilder().build()
  const onSubmit = jest.fn()

  const result = renderWithUserEvent(
    <SafeTxContext.Provider value={context}>
      <RemoveRecoveryFlowReview delayModifier={delayModifier} onSubmit={onSubmit} />
    </SafeTxContext.Provider>,
  )

  return { ...result, context, onSubmit }
}

describe('RemoveRecoveryFlowReview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateRemoveModuleTx.mockResolvedValue(builtTx)
  })

  it('warns that the Safe can no longer be recovered and lists every recoverer it removes', () => {
    const recoverers = [fakeAddress(), fakeAddress()]

    const { getByText } = renderReview(delayModifierWith(recoverers))

    expect(
      getByText(
        'This transaction will remove the recovery module from your Safe account. You will no longer be able to recover your Safe account once this transaction is executed.',
      ),
    ).toBeInTheDocument()
    expect(getByText('Removing Recoverer')).toBeInTheDocument()
    recoverers.forEach((recoverer) => expect(getByText(recoverer)).toBeInTheDocument())
  })

  it('disables the Delay modifier module', async () => {
    const delayModifier = delayModifierWith([fakeAddress()])

    const { context } = renderReview(delayModifier)

    await waitFor(() => expect(context.setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(mockCreateRemoveModuleTx).toHaveBeenCalledWith(delayModifier.address)
  })

  it('reports an error when the removal cannot be built', async () => {
    const error = new Error('Cannot build transaction')
    mockCreateRemoveModuleTx.mockRejectedValue(error)

    const { context } = renderReview(delayModifierWith([fakeAddress()]))

    await waitFor(() => expect(context.setSafeTxError).toHaveBeenCalledWith(error))
    expect(context.setSafeTx).not.toHaveBeenCalled()
  })

  it('tracks the removal and submits', async () => {
    const { getByRole, onSubmit, user } = renderReview(delayModifierWith([fakeAddress()]))

    await user.click(getByRole('button', { name: 'Continue' }))

    expect(trackEvent).toHaveBeenCalledWith(RECOVERY_EVENTS.SUBMIT_RECOVERY_REMOVE)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
