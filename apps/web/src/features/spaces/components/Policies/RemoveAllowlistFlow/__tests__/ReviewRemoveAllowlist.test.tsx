import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import type { AllowlistRule } from '../../RecipientAllowlistFlow/types'
import { useBuildRemoveAllowlistTransaction } from '../useBuildRemoveAllowlistTransaction'
import ReviewRemoveAllowlist from '../ReviewRemoveAllowlist'

jest.mock('../useBuildRemoveAllowlistTransaction', () => ({ useBuildRemoveAllowlistTransaction: jest.fn() }))
jest.mock('@/features/policy-guard/public/hooks/usePolicyGuardDelay', () => ({ usePolicyGuardDelay: () => 86_400 }))
jest.mock('../../RecipientAllowlistFlow/ReviewStep/AllowlistTransactionCalls', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))

const GUARD = faker.finance.ethereumAddress()

const renderReview = (rules: AllowlistRule[]) =>
  render(
    <TxFlowContext.Provider
      value={
        {
          ...initialContext,
          data: { chainId: '11155111', safeAddress: faker.finance.ethereumAddress(), guardAddress: GUARD, rules },
        } as unknown as TxFlowContextType
      }
    >
      <SafeTxContext.Provider value={{} as SafeTxContextParams}>
        <ReviewRemoveAllowlist onSubmit={jest.fn()} />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )

describe('ReviewRemoveAllowlist', () => {
  it('should, when an owner reviews a removal, say that it is a request and that the allowlist stays active until its rules are deleted', () => {
    renderReview([{ tokenAddress: faker.finance.ethereumAddress(), recipients: [faker.finance.ethereumAddress()] }])

    const summary = screen.getByTestId('remove-allowlist-summary')
    expect(summary).toHaveTextContent('Request to remove the allowlist.')
    expect(summary).toHaveTextContent(
      'After 1 day, a second transaction needs to be executed to delete its rules, and a third to take the guard off. Until the second one is executed, the allowlist stays active.',
    )
  })

  it('should, when an owner reviews a removal, build it from the guard and the rules the Safe enforces', () => {
    const rules = [{ tokenAddress: faker.finance.ethereumAddress(), recipients: [faker.finance.ethereumAddress()] }]

    renderReview(rules)

    expect(useBuildRemoveAllowlistTransaction).toHaveBeenLastCalledWith(GUARD, rules)
  })
})
