import { faker } from '@faker-js/faker'
import type { ReactNode } from 'react'
import { parseUnits } from 'ethers'
import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType, TransactionTokenType, TransferDirection } from '@safe-global/store/gateway/types'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { fakerChecksummedAddress, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { mockChainId } from '@/tests/mocks/hooks'
import { mockSetTxFlow, safeScopeContextFor, TxModalWithScope, unwrapScopedFlow } from '@/tests/mocks/safeScope'
import { getStoreInstance } from '@/store'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import TransferActions from './TransferActions'

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => ReactNode }) => children(true),
}))

jest.mock('@/hooks/useChainId')

const mockChain = chainBuilder().with({ chainId: '1' }).build()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useChainId: () => '1',
  useChain: () => mockChain,
  useCurrentChain: () => mockChain,
  useHasFeature: () => false,
  default: () => ({ loading: false, loaded: true, error: undefined, configs: [mockChain] }),
}))

jest.mock('@/features/spaces/hooks/useUpsertWorkspaceSafeName', () => ({
  useUpsertWorkspaceSafeName: jest.fn(),
}))

jest.mock('@/features/spaces/hooks/useWorkspaceAddressBookLabel', () => ({
  useWorkspaceAddressBookLabel: () => 'Acme address book',
}))

const addr = (): `0x${string}` => faker.finance.ethereumAddress() as `0x${string}`

const incomingTransfer = (sender: string): TransferTransactionInfo => ({
  direction: TransferDirection.INCOMING,
  recipient: { value: addr() },
  sender: { value: sender },
  type: TransactionInfoType.TRANSFER,
  transferInfo: {
    tokenAddress: addr(),
    trusted: true,
    type: TransactionTokenType.ERC20,
    decimals: 18,
    value: parseUnits('1', 18).toString(),
    tokenName: 'Test',
    tokenSymbol: 'TST',
    imitation: false,
  },
})

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
  beforeEach(() => {
    mockChainId('1')
  })

  it('saves the counterparty of a transfer to the address book under the typed name', async () => {
    const sender = fakerChecksummedAddress()
    const name = faker.person.firstName()
    const { user } = renderWithUserEvent(<TransferActions address={sender} txInfo={incomingTransfer(sender)} trusted />)

    await user.click(screen.getByTestId('transfer-actions-btn'))
    await user.click(await screen.findByRole('menuitem', { name: 'Add to address book' }))

    const dialog = within(await screen.findByTestId('entry-dialog'))
    expect(dialog.getByDisplayValue(sender)).toBeDisabled()

    await user.type(dialog.getByRole('textbox', { name: /name/i }), name)
    await user.click(screen.getByTestId('save-btn'))

    expect(getStoreInstance().getState().addressBook['1'][sender]).toBe(name)
  })

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
