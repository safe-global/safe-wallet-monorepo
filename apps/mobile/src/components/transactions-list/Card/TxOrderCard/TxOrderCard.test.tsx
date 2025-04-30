import { render } from '@/src/tests/test-utils'
import { TxOrderCard } from '.'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { mockSwapTransfer } from '@/src/tests/mocks'

describe('TxSwapCard', () => {
  it('should render the default markup', () => {
    const container = render(<TxOrderCard onPress={() => null} txInfo={mockSwapTransfer as OrderTransactionInfo} />)

    expect(container).toMatchSnapshot()
  })
})
