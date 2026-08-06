import { chainBuilder } from '@safe-global/utils/tests/builders/chains'
import { render } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { parseEther } from 'ethers'
import WalletBalance from '.'

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () =>
    chainBuilder()
      .with({
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          logoUri: faker.internet.url({ appendSlash: false }),
        },
      })
      .build(),
}))

describe('WalletBalance', () => {
  it('should render a skeleton if undefined', () => {
    const result = render(<WalletBalance balance={undefined} />)
    expect(result.queryByText('ETH')).toBeNull()
  })

  it('should render zero if zero balance', () => {
    const result = render(<WalletBalance balance={0n} />)
    expect(result.queryByText('0 ETH')).not.toBeNull()
  })

  it('should render formatted amount if non-zero balance', () => {
    const result = render(<WalletBalance balance={parseEther('1')} />)
    expect(result.queryByText('1 ETH')).not.toBeNull()
  })

  it('should render formatted decimals if non-zero balance', () => {
    const result = render(<WalletBalance balance={parseEther('0.25')} />)
    expect(result.queryByText('0.25 ETH')).not.toBeNull()
  })
})
