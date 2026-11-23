import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { buildGuardRemovalCleanupConfigurations } from '@/features/policy-guard/public/services/guardRemoval'
import { useBuildRemoveGuardTransaction } from '../useBuildRemoveGuardTransaction'
import { usePreviousFallbackHandler } from '../usePreviousFallbackHandler'
import ReviewRemoveGuard from '../ReviewRemoveGuard'

jest.mock('../useBuildRemoveGuardTransaction', () => ({ useBuildRemoveGuardTransaction: jest.fn() }))
jest.mock('../usePreviousFallbackHandler', () => ({ usePreviousFallbackHandler: jest.fn() }))
jest.mock('../../RecipientAllowlistFlow/ReviewStep/AllowlistTransactionCalls', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))

const CHAIN_ID = '11155111'
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
      <SafeTxContext.Provider value={{} as SafeTxContextParams}>
        <ReviewRemoveGuard onSubmit={jest.fn()} />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )

describe('ReviewRemoveGuard', () => {
  it('should build the guard removal with the handler from before the setup and the clean-up, when both are known', () => {
    const handler = faker.finance.ethereumAddress()
    const cleanup = buildGuardRemovalCleanupConfigurations(CHAIN_ID, SAFE)
    jest.mocked(usePreviousFallbackHandler).mockReturnValue({ address: handler, isDefault: false })

    renderReview(cleanup)

    expect(useBuildRemoveGuardTransaction).toHaveBeenLastCalledWith(GUARD, handler, cleanup)
    expect(screen.queryByTestId('remove-guard-default-fallback-handler')).not.toBeInTheDocument()
  })

  it('should say that the default fallback handler is set, when the handler from before the setup could not be read', () => {
    jest
      .mocked(usePreviousFallbackHandler)
      .mockReturnValue({ address: faker.finance.ethereumAddress(), isDefault: true })

    renderReview()

    const notice = screen.getByTestId('remove-guard-default-fallback-handler')
    expect(notice).toHaveTextContent('The fallback handler the Safe account had before the setup could not be read.')
    expect(notice).toHaveTextContent('It is set to the default fallback handler.')
  })
})
