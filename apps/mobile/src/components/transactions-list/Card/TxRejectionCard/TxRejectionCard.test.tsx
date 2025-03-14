import { render } from '@/src/tests/test-utils'
import { TxRejectionCard } from '.'
import { mockTransferWithInfo } from '@/src/tests/mocks'
import { Cancellation } from '@safe-global/store/gateway/types'

describe('TxRejectionCard', () => {
  it('should render the default markup', () => {
    const { getByText } = render(
      <TxRejectionCard onPress={() => null} txInfo={mockTransferWithInfo({}) as Cancellation} />,
    )

    expect(getByText('Rejected')).toBeTruthy()
  })
})
