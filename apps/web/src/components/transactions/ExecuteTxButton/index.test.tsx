import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import { mockSetTxFlow, safeScopeContextFor, TxModalWithScope, unwrapScopedFlow } from '@/tests/mocks/safeScope'
import { ConfirmTxFlow } from '@/components/tx-flow/flows'
import ExecuteTxButton from '.'

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

describe('ExecuteTxButton', () => {
  const nonce = faker.number.int({ max: 100 })
  const nextTx = safeTxSummaryBuilder()
    .with({ executionInfo: executionInfoBuilder().with({ nonce }).build() })
    .build()

  const getExecuteButton = () => screen.getByRole('button', { name: 'Execute' })

  const clickExecute = (scope?: ReturnType<typeof safeScopeContextFor>) => {
    const setTxFlow = mockSetTxFlow()
    render(
      <TxModalWithScope setTxFlow={setTxFlow} scope={scope}>
        <ExecuteTxButton txSummary={nextTx} />
      </TxModalWithScope>,
    )
    fireEvent.click(getExecuteButton())
    expect(setTxFlow).toHaveBeenCalledTimes(1)
    return setTxFlow.mock.calls[0]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true, nonce })
    mockRole('owner')
  })

  it('is disabled when the transaction is not next in the queue', () => {
    mockSafeInfo({ deployed: true, nonce: nonce + 1 })

    render(<ExecuteTxButton txSummary={nextTx} />)

    expect(getExecuteButton()).toBeDisabled()
  })

  it('opens the confirm flow unwrapped on a Safe-level page', () => {
    const [txFlow, onClose, shouldWarn] = clickExecute()

    expect(txFlow?.type).toBe(ConfirmTxFlow)
    expect(onClose).toBeUndefined()
    expect(shouldWarn).toBe(false)
  })

  it("opens the confirm flow inside the row's SafeScope", () => {
    const target = { chainId: faker.string.numeric(5), safeAddress: faker.finance.ethereumAddress() }

    const [txFlow, , shouldWarn] = clickExecute(safeScopeContextFor(target))

    const { flow, target: flowTarget } = unwrapScopedFlow(txFlow)
    expect(flow?.type).toBe(ConfirmTxFlow)
    expect(flowTarget).toEqual(target)
    expect(shouldWarn).toBe(false)
  })
})
