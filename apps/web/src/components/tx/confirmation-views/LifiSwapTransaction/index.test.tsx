import { faker } from '@faker-js/faker'
import { formatUnits } from 'ethers'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { render } from '@/tests/test-utils'
import { LifiSwapTransaction } from '.'
import { mockLifiSwapTxInfo } from './mockData'

describe('LifiSwapTransaction', () => {
  it('shows the total fee', () => {
    const integratorFee = faker.number.bigInt({ min: 1n, max: 10n ** 18n })
    const lifiFee = faker.number.bigInt({ min: 1n, max: 10n ** 18n })
    const txInfo = {
      ...mockLifiSwapTxInfo,
      fees: {
        tokenAddress: faker.finance.ethereumAddress(),
        integratorFee: integratorFee.toString(),
        lifiFee: lifiFee.toString(),
      },
    }
    const totalFee = formatUnits(integratorFee + lifiFee, txInfo.fromToken.decimals)

    const { getByTestId } = render(<LifiSwapTransaction txInfo={txInfo} isPreview={false} />)

    expect(getByTestId('total-fee')).toHaveTextContent(`${formatAmount(totalFee)} ${txInfo.fromToken.symbol}`)
  })

  it('shows an unknown fee if the fees could not be decoded', () => {
    const { getByTestId } = render(
      <LifiSwapTransaction txInfo={{ ...mockLifiSwapTxInfo, fees: null }} isPreview={false} />,
    )

    expect(getByTestId('total-fee')).toHaveTextContent('Unknown')
  })
})
