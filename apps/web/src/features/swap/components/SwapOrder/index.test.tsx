import { faker } from '@faker-js/faker'
import { Interface, getAddress } from 'ethers'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/types-kit'
import { ERC20__factory, Multi_send__factory } from '@safe-global/utils/types/contracts'
import type { SwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { render, screen } from '@/tests/test-utils'
import { transactionDataBuilder } from '@/tests/builders/transactionDetails'
import { swapOrderConfirmationViewBuilder } from '@/features/swap/helpers/swapOrderBuilder'
import { COW_SETTLEMENT_CONTRACTS } from '@/features/swap/helpers/utils'
import SwapOrder from '.'

const SETTLEMENT_INTERFACE = new Interface(['function setPreSignature(bytes orderUid, bool signed)'])
const MULTISEND_INTERFACE = Multi_send__factory.createInterface()
const ERC20_INTERFACE = ERC20__factory.createInterface()

const order = swapOrderConfirmationViewBuilder()
  .with({ uid: faker.string.hexadecimal({ length: 112, casing: 'lower' }) })
  .build() as SwapOrderTransactionInfo

const presign = {
  to: COW_SETTLEMENT_CONTRACTS[0],
  value: '0',
  data: SETTLEMENT_INTERFACE.encodeFunctionData('setPreSignature', [order.uid, true]),
  operation: OperationType.Call,
}

const tokenTransfer = {
  to: getAddress(faker.finance.ethereumAddress()),
  value: '0',
  data: ERC20_INTERFACE.encodeFunctionData('transfer', [getAddress(faker.finance.ethereumAddress()), 1n]),
  operation: OperationType.Call,
}

const batchTxData = (calls: Array<typeof presign>) =>
  transactionDataBuilder()
    .with({
      hexData: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [encodeMultiSendData(calls)]),
      operation: OperationType.DelegateCall,
      trustedDelegateCallTarget: true,
    })
    .build()

describe('SwapOrder', () => {
  it('warns when the swap order is batched with other actions', () => {
    render(<SwapOrder txInfo={order} txData={batchTxData([tokenTransfer, tokenTransfer, presign])} />)

    expect(screen.getByTestId('swap-extra-actions-warning')).toHaveTextContent('It also contains 2 other actions')
  })

  it('does not warn for a swap order on its own', () => {
    render(<SwapOrder txInfo={order} txData={batchTxData([presign])} />)

    expect(screen.queryByTestId('swap-extra-actions-warning')).not.toBeInTheDocument()
  })
})
