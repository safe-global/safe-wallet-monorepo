import { render } from '@/src/tests/test-utils'
import { AccountCard } from './AccountCard'
import { mockedActiveSafeInfo, mockedChains } from '@/src/store/constants'
import { Address } from '@/src/types/address'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { ellipsis } from '@/src/utils/formatters'

describe('AccountCard', () => {
  it('should render the account card with only one chain provided', () => {
    const accountName = 'This is my account'
    const balance = '758.932'
    const container = render(
      <AccountCard
        name={accountName}
        chains={mockedChains as unknown as Chain[]}
        owners={5}
        balance={balance}
        address={mockedActiveSafeInfo.address.value as Address}
        threshold={2}
      />,
    )
    expect(container.getByTestId('threshold-info-badge')).toBeVisible()
    expect(container.getByText('2/5')).toBeDefined()
    expect(container.getByText(`$ 758.93`)).toBeDefined()
    expect(container.getByText(accountName)).toBeDefined()
  })

  it('should truncate the account information when they are very long', () => {
    const longAccountName = 'This is my account with a very very long text'
    const longBalance = '21312321312213213121221312321312312'
    const container = render(
      <AccountCard
        name={longAccountName}
        chains={mockedChains as unknown as Chain[]}
        owners={5}
        balance={longBalance}
        address={mockedActiveSafeInfo.address.value as Address}
        threshold={2}
      />,
    )
    expect(container.getByTestId('threshold-info-badge')).toBeVisible()
    expect(container.getByText('2/5')).toBeDefined()
    expect(container.getByText(`$ 21,312,321,3...`)).toBeDefined()
    expect(container.getByText(ellipsis(longAccountName, 18))).toBeDefined()
  })
})
