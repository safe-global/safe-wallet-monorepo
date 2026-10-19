import { faker } from '@faker-js/faker'
import type { ReactNode } from 'react'
import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType, TransactionTokenType, TransferDirection } from '@safe-global/store/gateway/types'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { mockSetTxFlow, safeScopeContextFor, TxModalWithScope, unwrapScopedFlow } from '@/tests/mocks/safeScope'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import TransferActions from './TransferActions'

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => ReactNode }) => children(true),
}))

const recipient = faker.finance.ethereumAddress()

const outgoingNativeTransfer = {
  type: TransactionInfoType.TRANSFER,
  direction: TransferDirection.OUTGOING,
  sender: { value: faker.finance.ethereumAddress() },
  recipient: { value: recipient },
  transferInfo: { type: TransactionTokenType.NATIVE_COIN, value: '1000000000000000000' },
} as TransferTransactionInfo

const renderAndSendAgain = async (scope?: SafeScopeContextValue) => {
  const setTxFlow = mockSetTxFlow()
  const { user } = renderWithUserEvent(
    <TxModalWithScope setTxFlow={setTxFlow} scope={scope}>
      <TransferActions address={recipient} txInfo={outgoingNativeTransfer} trusted />
    </TxModalWithScope>,
  )

  await user.click(screen.getByTestId('transfer-actions-btn'))
  await user.click(await screen.findByText('Send again'))

  return setTxFlow
}

describe('TransferActions', () => {
  it('opens "Send again" for the Safe scope of the row it is in', async () => {
    const target = { chainId: faker.string.numeric(5), safeAddress: faker.finance.ethereumAddress() }

    const setTxFlow = await renderAndSendAgain(safeScopeContextFor(target))

    const { flow, target: scopedTarget, pollSafeInfo } = unwrapScopedFlow(setTxFlow.mock.calls[0][0])
    expect(scopedTarget).toEqual(target)
    expect(pollSafeInfo).toBe(false)
    expect(flow?.type).toBe(TokenTransferFlow)
  })

  it('opens "Send again" unwrapped outside a Safe scope', async () => {
    const setTxFlow = await renderAndSendAgain()

    const { flow, target } = unwrapScopedFlow(setTxFlow.mock.calls[0][0])
    expect(target).toBeUndefined()
    expect(flow?.type).toBe(TokenTransferFlow)
  })
})
