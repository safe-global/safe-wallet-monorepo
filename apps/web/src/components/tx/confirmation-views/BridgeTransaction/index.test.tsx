import { faker } from '@faker-js/faker'
import { formatUnits } from 'ethers'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { render } from '@/tests/test-utils'
import BridgeTransaction from '.'
import { mockPendingBridgeTxInfo } from './mockData'

jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))

describe('BridgeTransaction', () => {
  it('shows the total fee', () => {
    const integratorFee = faker.number.bigInt({ min: 1n, max: 10n ** 18n })
    const lifiFee = faker.number.bigInt({ min: 1n, max: 10n ** 18n })
    const txInfo = {
      ...mockPendingBridgeTxInfo,
      fees: {
        tokenAddress: faker.finance.ethereumAddress(),
        integratorFee: integratorFee.toString(),
        lifiFee: lifiFee.toString(),
      },
    }
    const totalFee = formatUnits(integratorFee + lifiFee, txInfo.fromToken.decimals)

    const { getByTestId } = render(<BridgeTransaction txInfo={txInfo} />)

    expect(getByTestId('total-fee')).toHaveTextContent(`${formatAmount(totalFee)} ${txInfo.fromToken.symbol}`)
  })

  it('shows an unknown fee if the fees could not be decoded', () => {
    const { getByTestId } = render(<BridgeTransaction txInfo={{ ...mockPendingBridgeTxInfo, fees: null }} />)

    expect(getByTestId('total-fee')).toHaveTextContent('Unknown')
  })
})
