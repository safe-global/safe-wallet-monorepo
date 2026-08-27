import { render, screen } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { TokenType } from '@safe-global/store/gateway/types'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { PortfolioBalances } from '@/hooks/loadables/useLoadBalances'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../types'
import CreateSpendingLimit from './index'
import * as useVisibleBalancesHook from '@/hooks/useVisibleBalances'
import * as useIsSpendingLimitSupportedHook from '../../hooks/useIsSpendingLimitSupported'

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  useSafeShieldForAddressPoisoning: jest.fn(),
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => '1',
}))

const nativeBalance: Balances['items'][number] = {
  balance: '1000000000000000000',
  fiatBalance: '1000',
  fiatConversion: '1000',
  tokenInfo: {
    address: ZERO_ADDRESS,
    decimals: 18,
    logoUri: '',
    name: 'Ether',
    symbol: 'ETH',
    type: TokenType.NATIVE_TOKEN,
  },
}

const mockBalances = (items: Balances['items']) => {
  jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
    balances: { items, fiatTotal: '' } as PortfolioBalances,
    loaded: true,
    loading: false,
  })
}

const renderForm = (data?: Partial<NewSpendingLimitFlowProps>) => {
  const context: TxFlowContextType<NewSpendingLimitFlowProps> = {
    ...initialContext,
    data: {
      [SpendingLimitFields.beneficiary]: '',
      [SpendingLimitFields.tokenAddress]: ZERO_ADDRESS,
      [SpendingLimitFields.amount]: '',
      [SpendingLimitFields.resetTime]: '0',
      ...data,
    },
    onNext: jest.fn(),
  }

  return render(
    <TxFlowContext.Provider value={context as TxFlowContextType}>
      <CreateSpendingLimit />
    </TxFlowContext.Provider>,
  )
}

describe('CreateSpendingLimit', () => {
  beforeEach(() => {
    jest.spyOn(useIsSpendingLimitSupportedHook, 'default').mockReturnValue(true)
  })

  afterEach(() => jest.restoreAllMocks())

  it('does not render the raw token address in the amount selector when the Safe has no balances', () => {
    mockBalances([])

    renderForm()

    expect(screen.getByTestId('token-selector')).not.toHaveTextContent(ZERO_ADDRESS)
  })

  it('shows the selected token when it is present in the balances', () => {
    mockBalances([nativeBalance])

    renderForm()

    expect(screen.getByTestId('token-selector')).toHaveTextContent('ETH')
  })
})
