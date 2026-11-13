import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import type { SafeTransaction } from '@safe-global/types-kit'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { mockCurrentChain, mockSafeInfo, mockWallet } from '@/tests/mocks/hooks'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { dispatchRecoveryProposal } from '../../../services/recovery-sender'
import RecoverAccountReview from '../index'

type GasPrice = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
const mockUseGasPrice = jest.fn<[GasPrice | undefined, Error | undefined, boolean], []>()
jest.mock('@/hooks/useGasPrice', () => ({ __esModule: true, default: () => mockUseGasPrice() }))

const DELAY_MODIFIER = faker.finance.ethereumAddress()
jest.mock('../../../hooks/useRecovery', () => ({ __esModule: true, default: () => [[]] }))
jest.mock('../../../services/selectors', () => ({
  selectDelayModifierByRecoverer: () => ({ address: DELAY_MODIFIER, delay: BigInt(0) }),
}))
jest.mock('../../../hooks/useIsValidRecoveryExecution', () => ({
  useIsValidRecoveryExecTransactionFromModule: () => [undefined, undefined],
}))
jest.mock('../../../services/recovery-sender', () => ({ dispatchRecoveryProposal: jest.fn() }))
jest.mock('../../../services/transaction', () => ({ getRecoveryProposalTransactions: () => [] }))
jest.mock('@/services/tx/tx-sender', () => ({
  createTx: jest.fn(() => new Promise(() => {})),
  createMultiSendCallOnlyTx: jest.fn(() => new Promise(() => {})),
}))

jest.mock('@/components/tx/confirmation-views/useTxPreview', () => ({ __esModule: true, default: () => [undefined] }))
jest.mock('@/components/tx/security/BalanceChanges', () => ({ BalanceChanges: () => null }))
jest.mock('@/components/new-safe/create/NetworkWarning', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/wallets/useOnboard', () => ({ __esModule: true, default: () => ({}) }))
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')

const mockDispatchRecoveryProposal = dispatchRecoveryProposal as jest.MockedFunction<typeof dispatchRecoveryProposal>
const GAS_PRICE: GasPrice = { maxFeePerGas: BigInt(2), maxPriorityFeePerGas: BigInt(1) }

const renderReview = () => {
  const safeTx = { data: { to: faker.finance.ethereumAddress() } } as unknown as SafeTransaction
  const context = { safeTx, setSafeTx: jest.fn(), setSafeTxError: jest.fn() } as unknown as SafeTxContextParams
  render(
    <SafeTxContext.Provider value={context}>
      <RecoverAccountReview threshold="1" owners={[{ value: faker.finance.ethereumAddress() }]} />
    </SafeTxContext.Provider>,
  )
  return screen.getByTestId('execute-btn')
}

describe('RecoverAccountReview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo()
    const chain = mockCurrentChain()
    ;(jest.requireMock('@/hooks/useChains').default as jest.Mock).mockReturnValue({ configs: [chain] })
    mockWallet()
  })

  it('keeps Execute disabled while the gas price has not loaded', () => {
    mockUseGasPrice.mockReturnValue([undefined, undefined, true])

    const executeButton = renderReview()
    fireEvent.click(executeButton)

    expect(executeButton).toBeDisabled()
    expect(mockDispatchRecoveryProposal).not.toHaveBeenCalled()
  })

  it('explains why Execute stays disabled when the gas price cannot be loaded', () => {
    mockUseGasPrice.mockReturnValue([undefined, new Error('Gas oracle unavailable'), false])

    const executeButton = renderReview()

    expect(screen.getByText("Couldn't load the gas price")).toBeInTheDocument()
    expect(executeButton).toBeDisabled()
  })

  it('sends the recovery proposal to the Delay modifier once the gas price has loaded', async () => {
    mockUseGasPrice.mockReturnValue([GAS_PRICE, undefined, false])

    const executeButton = renderReview()
    expect(executeButton).toBeEnabled()
    fireEvent.click(executeButton)

    await waitFor(() => expect(mockDispatchRecoveryProposal).toHaveBeenCalledTimes(1))
    expect(mockDispatchRecoveryProposal.mock.calls[0][0]).toMatchObject({ delayModifierAddress: DELAY_MODIFIER })
  })
})
