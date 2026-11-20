import type { SwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { swapOrderFixtures, type RecordedTransaction } from '@safe-global/test/msw/fixtures'
import {
  createBalanceHandlersFromFixture,
  createTransactionHandlersFromFixture,
} from '@safe-global/test/msw/handlers/fromFixtures'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { userEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
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

const {
  sell1Action,
  buy2actions,
  safeAppSwapOrder,
  sellLimitOrder,
  wrapSwap,
  sell3Actions,
  sellCancelled,
  sellLimitOrderFilled,
  partiallyFilledLimit,
  twapPartial,
  twapFilled,
  sellQLimitOrder,
  sellSwapQLimitOrder,
  sellTwapQLimitOrder,
} = swapOrderFixtures

const STATUS_SUCCESS = 'Success'

const sepolia = chainBuilder()
  .with({
    chainId: '11155111',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
  })
  .build()

const isQueued = ({ item }: RecordedTransaction) => item.transaction.txStatus === 'AWAITING_CONFIRMATIONS'

const renderOrder = (order: RecordedTransaction, { expanded }: { expanded: boolean }) => {
  const safeAddress = order.details.safeAddress
  const safe = extendedSafeInfoBuilder()
    .with({ address: { value: safeAddress }, chainId: sepolia.chainId, threshold: isQueued(order) ? 2 : 1 })
    .build()

  return render(<ExpandableTransactionItem item={order.item} txDetails={expanded ? order.details : undefined} />, {
    routerProps: {
      pathname: isQueued(order) ? AppRoutes.transactions.queue : AppRoutes.transactions.history,
      query: { safe: `sep:${safeAddress}` },
    },
    initialReduxState: { safeInfo: { data: safe, loading: false, loaded: true } },
  })
}

const findSummaryRow = () => screen.findByTestId('transaction-item')

const findOrderDetails = async () => {
  await screen.findByTestId('transaction-actions-list')
  const details = screen.getByTestId('accordion-details')
  await within(details).findByText(/^(Sell|Buy) order$/)
  return details
}

const openAdvancedDetails = () => userEvent.click(screen.getByTestId('tx-advanced-details'))

const expectTokenIcons = (row: HTMLElement, symbols: string[]) => {
  symbols.forEach((symbol) => expect(within(row).getByTitle(symbol)).toBeInTheDocument())
}

describe('ExpandableTransactionItem with recorded swap orders', () => {
  beforeEach(() => {
    server.use(
      ...createTransactionHandlersFromFixture(GATEWAY_URL),
      ...createBalanceHandlersFromFixture('empty', GATEWAY_URL),
      http.get(`${GATEWAY_URL}/v2/chains/:chainId/delegates`, () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
      ),
    )
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(sepolia)
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => feature === FEATURES.NATIVE_SWAPS)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each([
    {
      name: 'a filled sell order',
      order: sell1Action,
      expanded: ['Sell order', /Sell\s*1 COW/, /for at least .* DAI/, 'Filled'],
    },
    {
      name: 'an expired buy order with an approve and a pre-signature',
      order: buy2actions,
      expanded: [
        'Buy order',
        /For at most .* COW/,
        'Expired',
        'CoW Protocol Token: approve',
        'GPv2Settlement: setPreSignature',
      ],
    },
    {
      name: 'a wrap and swap',
      order: wrapSwap,
      expanded: [
        'Wrapped Ether: deposit',
        'Wrapped Ether: approve',
        'GPv2Settlement: setPreSignature',
        /1 COW = 0\.003\d* WETH/,
        'Filled',
      ],
    },
    {
      name: 'a wrap, approve and swap in one batch',
      order: sell3Actions,
      expanded: [
        'Sell order',
        /for at least .* DAI/,
        /1 DAI = .* WETH/,
        'Wrapped Ether: deposit',
        'Wrapped Ether: approve',
        'GPv2Settlement: setPreSignature',
      ],
    },
    { name: 'a cancelled order', order: sellCancelled, expanded: ['Sell order', /1 UNI = .*K COW/, 'Cancelled'] },
    { name: 'a partially filled limit order', order: partiallyFilledLimit, expanded: ['Partially filled'] },
    { name: 'an expired limit order', order: sellLimitOrder, expanded: ['Expired', /1 DAI = .* COW/] },
    { name: 'a filled limit order', order: sellLimitOrderFilled, expanded: ['1 USDT = 0.19342 USDC', 'Filled'] },
    { name: 'an order from the CowSwap Safe App', order: safeAppSwapOrder, expanded: [/Sell\s*10 COW/, 'Filled'] },
  ])('shows the details of $name', async ({ order, expanded }) => {
    renderOrder(order, { expanded: true })

    const details = await findOrderDetails()
    expanded.forEach((text) => expect(details).toHaveTextContent(text))
  })

  it('links the order ID to the order on the CoW explorer', async () => {
    const { explorerUrl } = sell1Action.details.txInfo as SwapOrderTransactionInfo
    renderOrder(sell1Action, { expanded: true })

    const details = await findOrderDetails()
    expect(within(getFieldValue(details, 'Order ID')).getByRole('link')).toHaveAttribute('href', explorerUrl)
  })

  it('shows the price of a filled order as the execution price, one buy token in sell tokens', async () => {
    renderOrder(sell1Action, { expanded: true })

    const details = await findOrderDetails()
    expect(getFieldValue(details, 'Execution price')).toHaveTextContent(/^1 DAI = .* COW$/)
  })

  it('shows the price of an unfilled order as the limit price, one buy token in sell tokens', async () => {
    renderOrder(buy2actions, { expanded: true })

    const details = await findOrderDetails()
    expect(getFieldValue(details, 'Limit price')).toHaveTextContent('1 GNO = 8.4747 COW')
  })

  it.each([
    { name: 'a sell order', order: sell1Action, advanced: ['GPv2Settlement', 'setPreSignature'] },
    { name: 'a limit order', order: sellLimitOrder, advanced: ['GPv2Settlement', 'setPreSignature'] },
    { name: 'a batched buy order', order: buy2actions, advanced: ['multiSend', 'Safe: MultiSendCallOnly 1.3.0'] },
    { name: 'a wrap and swap batch', order: sell3Actions, advanced: ['multiSend', 'Safe: MultiSendCallOnly 1.3.0'] },
  ])('shows the contract call of $name in the advanced details', async ({ order, advanced }) => {
    renderOrder(order, { expanded: true })

    const details = await findOrderDetails()
    await openAdvancedDetails()
    advanced.forEach((text) => expect(details).toHaveTextContent(text))
  })

  it.each([
    { title: 'Swap order', order: safeAppSwapOrder, tokens: ['DAI', 'COW'] },
    { title: 'Limit order', order: sellLimitOrderFilled, tokens: ['USDT', 'USDC'] },
    { title: 'TWAP order', order: twapFilled, tokens: ['DAI', 'WETH'] },
  ])('summarises an executed $title with its token icons', async ({ title, order, tokens }) => {
    renderOrder(order, { expanded: false })

    const row = await findSummaryRow()
    expect(row).toHaveTextContent(title)
    expect(row).toHaveTextContent(STATUS_SUCCESS)
    expectTokenIcons(row, tokens)
  })

  it.each([
    {
      name: 'partially filled',
      order: twapPartial,
      status: 'Partially filled',
      filled: '50 %',
      tokens: ['DAI', 'WETH'],
    },
    { name: 'filled', order: twapFilled, status: 'Filled', filled: '100 %', tokens: ['WETH', 'DAI'] },
  ])('shows the parts, part amounts and fill of a $name TWAP order', async ({ order, status, filled, tokens }) => {
    const [sellToken, buyToken] = tokens
    renderOrder(order, { expanded: true })

    const details = await findOrderDetails()
    expect(details).toHaveTextContent(status)
    expect(getFieldValue(details, 'No of parts')).toHaveTextContent(/^2$/)
    expect(getFieldValue(details, 'Part duration')).toHaveTextContent('30 minutes')
    expect(getFieldValue(details, 'Sell amount')).toHaveTextContent(new RegExp(`\\d+(\\.\\d+)?\\s*${sellToken}`))
    expect(getFieldValue(details, 'Buy amount')).toHaveTextContent(new RegExp(`\\d+(\\.\\d+)?\\s*${buyToken}`))
    const filledRow = getFieldValue(details, 'Filled')
    expect(filledRow).toHaveTextContent(filled)
    expect(filledRow).toHaveTextContent('sold')

    await openAdvancedDetails()
    expect(details).toHaveTextContent('createWithContext')
    expect(details).toHaveTextContent('ComposableCoW')
  })

  it.each([
    { title: 'Limit order', order: sellQLimitOrder },
    { title: 'Swap order', order: sellSwapQLimitOrder },
    { title: 'TWAP order', order: sellTwapQLimitOrder },
  ])('summarises a queued $title awaiting the second confirmation', async ({ title, order }) => {
    renderOrder(order, { expanded: false })

    const row = await findSummaryRow()
    expect(row).toHaveTextContent(title)
    expect(row).toHaveTextContent('1/2')
    expectTokenIcons(row, ['DAI', 'COW'])
  })

  it.each([
    { name: 'limit order', order: sellQLimitOrder, expanded: ['Status', 'Order ID', 'Limit price', 'Expired'] },
    { name: 'swap order', order: sellSwapQLimitOrder, expanded: [/Sell\s*100 COW/, 'Expired'] },
  ])('shows the status and price of a queued $name', async ({ order, expanded }) => {
    renderOrder(order, { expanded: true })

    const details = await findOrderDetails()
    expanded.forEach((text) => expect(details).toHaveTextContent(text))
  })

  it('shows the parts and fill of a queued TWAP order that still needs execution', async () => {
    renderOrder(sellTwapQLimitOrder, { expanded: true })

    const details = await findOrderDetails()
    expect(details).toHaveTextContent('Execution needed')
    expect(getFieldValue(details, 'No of parts')).toHaveTextContent(/^2$/)
    expect(getFieldValue(details, 'Filled')).toHaveTextContent('0 %')
    expect(getFieldValue(details, 'Part duration')).toHaveTextContent('182 days')
  })

  it.each([
    { name: 'limit order', order: sellQLimitOrder, advanced: ['GPv2Settlement', 'setPreSignature'] },
    { name: 'swap order', order: sellSwapQLimitOrder, advanced: [] },
  ])('flags the trusted delegate call of a queued $name', async ({ order, advanced }) => {
    renderOrder(order, { expanded: true })

    const details = await findOrderDetails()
    await openAdvancedDetails()

    expect(await screen.findByTestId('delegate-call-warning')).toBeInTheDocument()
    expect(details).toHaveTextContent('Safe: MultiSendCallOnly 1.4.1')
    advanced.forEach((text) => expect(details).toHaveTextContent(text))
  })
})
