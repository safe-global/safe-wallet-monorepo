import { ChainIndicatorWithFiatBalance } from '../index'
import { render, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChainId from '@/hooks/useChainId'
import * as gatewayApi from '@/store/api/gateway'
import * as useBalances from '@/hooks/useBalances'

const SAFE_ADDRESS = '0x123'

describe('ChainIndicatorWithFiatBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses balances for the current chain', () => {
    const chain = chainBuilder().with({ chainId: '1', chainName: 'Ethereum', shortName: 'eth' }).build()

    jest.spyOn(useChainId, 'default').mockReturnValue('1')
    jest.spyOn(useBalances, 'default').mockReturnValue({ balances: { fiatTotal: '100', items: [] }, loading: false })

    const trigger = jest.fn()
    jest
      .spyOn(gatewayApi, 'useLazyGetSafeOverviewQuery')
      .mockReturnValue([trigger, { data: { fiatTotal: '200' } }] as any)

    const { getByText } = render(
      <ChainIndicatorWithFiatBalance isSelected={false} chain={chain} safeAddress={SAFE_ADDRESS} />,
      { initialReduxState: { chains: { data: [chain], loading: false } } },
    )

    expect(trigger).not.toHaveBeenCalled()
    expect(getByText(/100/)).toBeInTheDocument()
  })

  it('fetches overview for inactive chains', async () => {
    const chain = chainBuilder().with({ chainId: '10', chainName: 'Optimism', shortName: 'oeth' }).build()

    jest.spyOn(useChainId, 'default').mockReturnValue('1')
    jest.spyOn(useBalances, 'default').mockReturnValue({ balances: { fiatTotal: '100', items: [] }, loading: false })

    const trigger = jest.fn()
    jest
      .spyOn(gatewayApi, 'useLazyGetSafeOverviewQuery')
      .mockReturnValue([trigger, { data: { fiatTotal: '50' } }] as any)

    const { getByText } = render(
      <ChainIndicatorWithFiatBalance isSelected={false} chain={chain} safeAddress={SAFE_ADDRESS} />,
      { initialReduxState: { chains: { data: [chain], loading: false } } },
    )

    await waitFor(() => expect(trigger).toHaveBeenCalled())
    expect(getByText(/50/)).toBeInTheDocument()
  })
})
