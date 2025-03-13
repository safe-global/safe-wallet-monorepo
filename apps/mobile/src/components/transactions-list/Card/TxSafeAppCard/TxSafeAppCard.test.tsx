import { render } from '@/src/tests/test-utils'
import { TxSafeAppCard } from '.'
import { mockTransferWithInfo } from '@/src/tests/mocks'
import { MultiSend } from '@safe-global/store/gateway/types'

describe('TxSafeAppCard', () => {
  it('should render the default markup', () => {
    const { getByText } = render(
      <TxSafeAppCard
        onPress={() => null}
        safeAppInfo={{
          name: 'Transaction Builder',
          url: 'http://something.com',
          logoUri: 'https://safe-transaction-assets.safe.global/safe_apps/29/icon.png',
        }}
        txInfo={mockTransferWithInfo({}) as MultiSend}
      />,
    )

    expect(getByText('Transaction Builder')).toBeTruthy()
    expect(getByText('Safe app')).toBeTruthy()
  })

  it('should render a fallback if no image url is provided', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <TxSafeAppCard
        onPress={() => null}
        safeAppInfo={{
          name: 'Transaction Builder',
          url: 'http://something.com',
        }}
        txInfo={mockTransferWithInfo({}) as MultiSend}
      />,
    )

    expect(getByText('Transaction Builder')).toBeTruthy()
    expect(getByText('Safe app')).toBeTruthy()
    expect(queryByTestId('safe-app-image')).not.toBeTruthy()
    expect(getByTestId('safe-app-fallback')).toBeTruthy()
  })
})
