import { faker } from '@faker-js/faker'
import { parseUnits } from 'ethers'
import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType, TransactionTokenType, TransferDirection } from '@safe-global/store/gateway/types'
import { fakerChecksummedAddress, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { mockChainId } from '@/tests/mocks/hooks'
import { getStoreInstance } from '@/store'
import TransferActions from './TransferActions'

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
})
