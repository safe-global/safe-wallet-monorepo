import { faker } from '@faker-js/faker'
import { Interface, getAddress } from 'ethers'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/types-kit'
import { Multi_send__factory } from '@safe-global/utils/types/contracts'
import type { SwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { render, screen } from '@/tests/test-utils'
import { transactionDataBuilder } from '@/tests/builders/transactionDetails'
import { swapOrderConfirmationViewBuilder } from '@/features/swap/helpers/swapOrderBuilder'
import { COW_DEPLOYMENTS } from '@/features/swap/helpers/swapOrderCalls'
import SwapOrderConfirmation from '.'

const SETTLEMENT_INTERFACE = new Interface(['function setPreSignature(bytes orderUid, bool signed)'])
const MULTISEND_INTERFACE = Multi_send__factory.createInterface()

const order = swapOrderConfirmationViewBuilder()
  .with({ uid: faker.string.hexadecimal({ length: 112, casing: 'lower' }) })
  .build() as SwapOrderTransactionInfo

const presign = {
  to: COW_DEPLOYMENTS[0].settlement,
  value: '0',
  data: SETTLEMENT_INTERFACE.encodeFunctionData('setPreSignature', [order.uid, true]),
  operation: OperationType.Call,
}

const nativeTransfer = {
  to: getAddress(faker.finance.ethereumAddress()),
  value: faker.number.bigInt({ min: 1n, max: 10n ** 18n }).toString(),
  data: '0x',
  operation: OperationType.Call,
}

describe('SwapOrderConfirmation', () => {
  it('warns when the swap order is batched with other actions', () => {
    const txData = transactionDataBuilder()
      .with({
        hexData: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [encodeMultiSendData([nativeTransfer, presign])]),
        operation: OperationType.DelegateCall,
        trustedDelegateCallTarget: true,
      })
      .build()

    render(<SwapOrderConfirmation order={order} settlementContract={txData.to.value} txData={txData} />)

    expect(screen.getByTestId('swap-extra-actions-warning')).toHaveTextContent(
      'This transaction does more than this swap. It also contains 1 other action',
    )
  })

  it('does not warn for a presignature sent to the settlement contract', () => {
    const txData = transactionDataBuilder()
      .with({ hexData: presign.data, to: { value: COW_DEPLOYMENTS[0].settlement } })
      .build()

    render(<SwapOrderConfirmation order={order} settlementContract={txData.to.value} txData={txData} />)

    expect(screen.queryByTestId('swap-extra-actions-warning')).not.toBeInTheDocument()
  })
})
