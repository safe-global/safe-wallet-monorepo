import { render } from '@/src/tests/test-utils'
import { TxCreationCard } from '.'
import { mockTransferWithInfo } from '@/src/tests/mocks'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import { CreationTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('TxCreationCard', () => {
  it('should render the default markup', () => {
    const { getByText } = render(
      <TxCreationCard
        onPress={() => null}
        txInfo={
          mockTransferWithInfo({
            type: TransactionInfoType.CREATION,
            creator: {
              name: 'Nevinha',
              logoUri: '',
              value: '0xas123da123sdasdsd001230sdf1sdf12sd12f',
            },
          }) as CreationTransactionInfo
        }
      />,
    )

    expect(getByText('Safe Account created')).toBeTruthy()
    expect(getByText('Created by: 0xas12...d12f')).toBeTruthy()
  })
})
