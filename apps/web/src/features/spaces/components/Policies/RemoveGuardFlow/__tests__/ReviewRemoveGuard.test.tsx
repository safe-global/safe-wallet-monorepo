import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { render, waitFor } from '@/tests/test-utils'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { buildGuardRemovalCleanupConfigurations } from '@/features/policy-guard/public/services/guardRemoval'
import { createSetFallbackHandlerTx } from '@/features/policy-guard/public/services/policyGuardEncoders'
import * as useChainsModule from '@/hooks/useChains'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import ReviewRemoveGuard from '../ReviewRemoveGuard'

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/services/tx/tx-sender/create', () => ({ createMultiSendCallOnlyTx: jest.fn() }))
jest.mock('../../RecipientAllowlistFlow/ReviewStep/AllowlistTransactionCalls', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))

const CHAIN_ID = '11155111'
const COMPATIBILITY_HANDLER_1_5_0 = '0x3EfCBb83A4A7AfcB4F68D501E2c2203a38be77f4'
const SAFE = faker.finance.ethereumAddress()
const GUARD = faker.finance.ethereumAddress()

const renderReview = (cleanupConfigurations = buildGuardRemovalCleanupConfigurations(CHAIN_ID, SAFE)) =>
  render(
    <TxFlowContext.Provider
      value={
        {
          ...initialContext,
          data: { chainId: CHAIN_ID, safeAddress: SAFE, guardAddress: GUARD, cleanupConfigurations },
        } as unknown as TxFlowContextType
      }
    >
      <SafeTxContext.Provider
        value={{ setSafeTx: jest.fn(), setSafeTxError: jest.fn() } as unknown as SafeTxContextParams}
      >
        <ReviewRemoveGuard onSubmit={jest.fn()} />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )

const mockScope = (version: string | undefined) =>
  jest.mocked(useSafeScope).mockReturnValue({
    chainId: CHAIN_ID,
    safeAddress: SAFE,
    sdk: {},
    safe: { version },
  } as unknown as ReturnType<typeof useSafeScope>)

describe('ReviewRemoveGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)
    jest
      .mocked(createMultiSendCallOnlyTx)
      .mockResolvedValue({} as Awaited<ReturnType<typeof createMultiSendCallOnlyTx>>)
  })

  it('should, when a Safe of 1.5.0 removes the guard, set the CompatibilityFallbackHandler of 1.5.0 in the batch', async () => {
    mockScope('1.5.0+L2')

    renderReview()

    await waitFor(() =>
      expect(createMultiSendCallOnlyTx).toHaveBeenCalledWith(
        expect.arrayContaining([createSetFallbackHandlerTx(SAFE, COMPATIBILITY_HANDLER_1_5_0)]),
        expect.anything(),
      ),
    )
  })

  it('should, when the version of the Safe is not known yet, build no batch', () => {
    mockScope(undefined)

    renderReview()

    expect(createMultiSendCallOnlyTx).not.toHaveBeenCalled()
  })
})
