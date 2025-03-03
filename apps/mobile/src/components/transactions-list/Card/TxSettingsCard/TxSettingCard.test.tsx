import { render } from '@/src/tests/test-utils'
import { TxSettingsCard } from '.'
import { mockTransferWithInfo } from '@/src/tests/mocks'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import { SettingsChangeTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('TxSettingCard', () => {
  it('should render the default markup', () => {
    const container = render(
      <TxSettingsCard
        onPress={() => null}
        txInfo={
          mockTransferWithInfo({
            type: TransactionInfoType.SETTINGS_CHANGE,
          }) as SettingsChangeTransaction
        }
      />,
    )

    expect(container).toMatchSnapshot()
  })
})
