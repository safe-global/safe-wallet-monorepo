import { faker } from '@faker-js/faker'
import type { Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { render, screen } from '@/tests/test-utils'
import * as useBalances from '@/hooks/useBalances'
import * as useChains from '@/hooks/useChains'
import { balanceBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import { chainBuilder } from '@/tests/builders/chains'
import { transactionDataBuilder } from '@/tests/builders/transactionDetails'
import { SpendingLimits } from '..'

const MAINNET = '1'
const ONE_DAY_IN_MINUTES = '1440'
const ONE_AND_A_HALF_USDC = '1500000'

const beneficiary = checksumAddress(faker.finance.ethereumAddress())
const usdc = erc20TokenBuilder().with({ symbol: 'USDC', decimals: 6 }).build()

const allowanceCall = (method: 'setAllowance' | 'deleteAllowance', values: string[]): TransactionData =>
  transactionDataBuilder()
    .with({ dataDecoded: { method, parameters: values.map((value) => ({ name: '', type: '', value })) } })
    .build()

const setAllowance = (amount = ONE_AND_A_HALF_USDC, resetTimeMin = ONE_DAY_IN_MINUTES) =>
  allowanceCall('setAllowance', [beneficiary, usdc.address, amount, resetTimeMin, '0'])

const deleteAllowance = () => allowanceCall('deleteAllowance', [beneficiary, usdc.address])

const givenSafeHolds = (tokens: Erc20Token[]) => {
  jest.spyOn(useBalances, 'default').mockReturnValue({
    balances: { items: tokens.map((tokenInfo) => balanceBuilder().with({ tokenInfo }).build()), fiatTotal: '0' },
    loaded: true,
    loading: false,
    error: undefined,
  })
}

describe('SpendingLimits', () => {
  beforeEach(() => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ chainId: MAINNET }).build())
    givenSafeHolds([usdc])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows the beneficiary, amount and reset time of a new limit', () => {
    render(<SpendingLimits txData={setAllowance()} type="setAllowance" />)

    expect(screen.getByText('Modify spending limit:')).toBeInTheDocument()
    expect(screen.getByText(beneficiary)).toBeInTheDocument()
    expect(screen.getByText('1.5 USDC')).toBeInTheDocument()
    expect(screen.getByText('1 day')).toBeInTheDocument()
  })

  it('shows the label of a one-time limit', () => {
    render(<SpendingLimits txData={setAllowance(ONE_AND_A_HALF_USDC, '0')} type="setAllowance" />)

    expect(screen.getByText('One time')).toBeInTheDocument()
  })

  it('shows the raw amount when the token is unknown', () => {
    givenSafeHolds([])

    render(<SpendingLimits txData={setAllowance()} type="setAllowance" />)

    expect(screen.getByText('Raw Amount (in decimals)')).toBeInTheDocument()
    expect(screen.getByText(ONE_AND_A_HALF_USDC)).toBeInTheDocument()
  })

  it('formats the amount with the token info of the transaction when the Safe holds none of the token', () => {
    givenSafeHolds([])
    const txData = { ...setAllowance(), tokenInfoIndex: { [usdc.address]: usdc } }

    render(<SpendingLimits txData={txData} type="setAllowance" />)

    expect(screen.getByText('1.5 USDC')).toBeInTheDocument()
  })

  it('says the spent amount resets when the batch resets it', () => {
    render(<SpendingLimits txData={setAllowance()} type="setAllowance" resetsSpent />)

    expect(screen.getByText('Reset to 0')).toBeInTheDocument()
  })

  it('shows the beneficiary and token of a removed limit, without amount or reset time', () => {
    render(<SpendingLimits txData={deleteAllowance()} type="deleteAllowance" />)

    expect(screen.getByText('Delete spending limit:')).toBeInTheDocument()
    expect(screen.getByText(beneficiary)).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.queryByText('Reset time')).not.toBeInTheDocument()
  })

  it('renders nothing without transaction data', () => {
    const { container } = render(<SpendingLimits txData={null} type="setAllowance" />)

    expect(container).toBeEmptyDOMElement()
  })
})
