import { render } from '@/src/tests/test-utils'
import { TxContractInteractionCard } from '.'
import { mockTransferWithInfo } from '@/src/tests/mocks'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import { CustomTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('TxContractInteractionCard', () => {
  it('should render the default markup', () => {
    const { getByText, getByLabelText } = render(
      <TxContractInteractionCard
        onPress={() => null}
        txInfo={
          mockTransferWithInfo({
            type: TransactionInfoType.CUSTOM,
            to: {
              value: '0x0000',
              name: 'CryptoNevinhosos',
              logoUri: 'http://nevinha.com/somethihng.png',
            },
          }) as CustomTransactionInfo
        }
      />,
    )

    expect(getByText('CryptoNevinhosos')).toBeTruthy()
    expect(getByLabelText('CryptoNevinhosos')).toBeTruthy()
  })

  it('should render a fallback in the label and icon if the contract is missing name and logoUri', () => {
    const { getByText } = render(
      <TxContractInteractionCard
        onPress={() => null}
        txInfo={
          mockTransferWithInfo({
            type: TransactionInfoType.CUSTOM,
            to: {
              value: '0x0000',
            },
          }) as CustomTransactionInfo
        }
      />,
    )

    expect(getByText('Contract interaction')).toBeTruthy()
  })
})
