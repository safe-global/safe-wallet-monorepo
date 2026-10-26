import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { stakingFixtures, type RecordedTransaction } from '@safe-global/test/msw/fixtures'
import {
  createBalanceHandlersFromFixture,
  createTransactionHandlersFromFixture,
} from '@safe-global/test/msw/handlers/fromFixtures'
import { getBeaconChainLink } from '@safe-global/utils/features/stake/utils/beaconChain'
import { userEvent } from '@testing-library/user-event'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { server } from '@/tests/server'
import { getFieldValue, render, screen, within } from '@/tests/test-utils'
import ExpandableTransactionItem from './ExpandableTransactionItem'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const { stake, withdrawal } = stakingFixtures
const STAKING_SAFE = withdrawal.details.safeAddress
const PERCENTAGE = /^\d+(\.\d+)?\s?%$/

const mainnet = chainBuilder()
  .with({ chainId: '1', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' } })
  .build()

const stakingSafe = extendedSafeInfoBuilder()
  .with({ address: { value: STAKING_SAFE }, chainId: '1' })
  .build()

const renderStakingItem = ({ item, details }: RecordedTransaction, expanded: boolean) =>
  render(<ExpandableTransactionItem item={item} txDetails={expanded ? details : undefined} />, {
    routerProps: { pathname: AppRoutes.transactions.history, query: { safe: `eth:${STAKING_SAFE}` } },
    initialReduxState: { safeInfo: { data: stakingSafe, loading: false, loaded: true } },
  })

const findLoadedDetails = async () => {
  await screen.findByTestId('transaction-actions-list')
  return screen.getByTestId('accordion-details')
}

describe('ExpandableTransactionItem with recorded staking transactions', () => {
  beforeEach(() => {
    server.use(
      ...createTransactionHandlersFromFixture(GATEWAY_URL),
      ...createBalanceHandlersFromFixture('empty', GATEWAY_URL),
    )
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mainnet)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows the staked amount and type of a stake', async () => {
    renderStakingItem(stake, false)

    const row = await screen.findByTestId('transaction-item')
    expect(row).toHaveTextContent('32 ETH')
    expect(row).toHaveTextContent('Stake')
  })

  it('shows the validator count of a withdraw request', async () => {
    renderStakingItem(withdrawal, false)

    const row = await screen.findByTestId('transaction-item')
    expect(row).toHaveTextContent('Withdraw request')
    expect(row).toHaveTextContent('1 Validator')
  })

  it('shows the validator link and status of a withdraw request', async () => {
    const [validator] = (withdrawal.details.txInfo as NativeStakingValidatorsExitTransactionInfo).validators
    renderStakingItem(withdrawal, true)

    const details = await findLoadedDetails()
    const validatorLink = within(getFieldValue(details, 'Exit')).getByRole('link', { name: 'Validator 1' })
    expect(validatorLink).toHaveAttribute('href', getBeaconChainLink('1', validator))
    expect(getFieldValue(details, 'Validator status')).toHaveTextContent('Withdrawn')

    await userEvent.click(screen.getByTestId('tx-advanced-details'))
    expect(details).toHaveTextContent('requestValidatorsExit')
    expect(details).toHaveTextContent('StakingContract')
  })

  it('shows the deposit, rewards, fee, validators and activation time of a stake', async () => {
    renderStakingItem(stake, true)

    const details = await findLoadedDetails()
    expect(getFieldValue(details, 'Deposit')).toHaveTextContent('ETH32')
    expect(getFieldValue(details, 'Net reward rate').textContent).toMatch(PERCENTAGE)
    expect(getFieldValue(details, 'Fee').textContent).toMatch(PERCENTAGE)
    expect(getFieldValue(details, 'Net annual rewards')).toHaveTextContent('ETH')
    expect(getFieldValue(details, 'Net monthly rewards')).toHaveTextContent('ETH')
    expect(getFieldValue(details, 'Validators')).toHaveTextContent(/^1$/)
    expect(getFieldValue(details, 'Activation time').textContent).not.toBe('')
    expect(getFieldValue(details, 'Rewards')).toHaveTextContent('Approx. every 5 days after activation')
  })
})
