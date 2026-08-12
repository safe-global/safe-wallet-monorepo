import type { ComponentProps, ReactNode } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { ChevronDownIcon } from 'lucide-react'
import type { MultisigTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { createMockStory } from '@/stories/mocks'
import { RouterDecorator } from '@/stories/routerDecorator'
import { AppRoutes } from '@/config/routes'
import { SAFE_ADDRESSES } from '../../../../../../config/test/msw/fixtures'
import TxSummary from './index'
import {
  historyAllTypes,
  historyNativeTransfer,
  historySwapSellOrder,
  queueAllTypes,
  queueCustom,
  queueErc20Transfer,
  queueLongSwapOrder,
  queueMultiSend,
  queueNativeTransfer,
  queueSettingsChange,
  queueSwapBuyOrder,
  queueSwapSellOrder,
} from './TxSummary.fixtures'

/**
 * TxSummary's grid switches on CSS **container** queries (680px and 380px), not the viewport, so a
 * story cannot exercise those breakpoints by resizing the Storybook canvas — the container has to be
 * constrained. This reproduces the row's real host, the accordion trigger in
 * ExpandableTransactionItem: the same `@container`, the same padding, typography and border, and the
 * same 16px chevron sharing the flex row, so the row is handed exactly the width it gets in the
 * queue. `width` is the card's width; the container's content box is that minus the trigger's
 * horizontal padding (48px above the `sm` breakpoint).
 */
const TxCard = ({ children, width }: { children: ReactNode; width?: number }) => (
  <div className="bg-card overflow-hidden rounded-lg border border-transparent" style={{ width, maxWidth: '100%' }}>
    <div className="@container relative flex cursor-pointer items-center justify-start overflow-x-auto rounded-md border border-transparent px-4 py-3 text-left text-sm font-medium sm:px-6">
      {children}
      <ChevronDownIcon className="text-muted-foreground pointer-events-none ml-auto size-4 shrink-0" />
    </div>
  </div>
)

/** One card per row with the list's 6px gutter, exactly as TxList stacks them. */
const TxCardStack = ({ items, width }: { items: MultisigTransaction[]; width?: number }) => (
  <div className="flex flex-col gap-[6px]">
    {items.map((item) => (
      <TxCard key={item.transaction.id} width={width}>
        <TxSummary item={item} />
      </TxCard>
    ))}
  </div>
)

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'none',
  pathname: AppRoutes.transactions.queue,
})

/**
 * `createMockStory`'s `parameters.nextjs.router` only reaches the row inside Storybook itself; the
 * snapshot tests compose these stories with `.storybook/preview` alone, so `useRouter` would be null
 * there (DateTime, the address book and the tx-type label all read it). Providing RouterContext
 * explicitly makes the row render the same in both.
 */
const withRouter = (pathname: string): Decorator => {
  const Wrapper: Decorator = (Story) => (
    <RouterDecorator
      router={{ pathname, route: pathname, asPath: pathname, query: { safe: `eth:${SAFE_ADDRESSES.efSafe.address}` } }}
    >
      <Story />
    </RouterDecorator>
  )
  return Wrapper
}

const meta = {
  title: 'Components/Transactions/TxSummary',
  component: TxSummary,
  loaders: [mswLoader],
  parameters: { ...setup.parameters, layout: 'fullscreen' },
  decorators: [withRouter(AppRoutes.transactions.queue), setup.decorator],
  args: { item: queueNativeTransfer },
  tags: ['autodocs'],
} satisfies Meta<typeof TxSummary>

export default meta
type Story = StoryObj<typeof meta>

type TxSummaryArgs = ComponentProps<typeof TxSummary>

/** Renders the story's `item` as a single row, optionally in a fixed-width card. */
const asRow = (width?: number) => {
  // Named rather than returned inline: the inner arrow is a component, and react/display-name
  // errors on an anonymous one.
  const Row = (args: TxSummaryArgs) => (
    <TxCard width={width}>
      <TxSummary {...args} />
    </TxCard>
  )
  Row.displayName = 'TxSummaryRow'
  return Row
}

/**
 * History rows show the time of day instead of a relative label, and only on the history route — so
 * these stories have to move the router there (parameters for Storybook, the decorator for the
 * snapshot tests). Story decorators sit inside meta ones, so this router wins over the queue one.
 */
const historyRoute = {
  parameters: { nextjs: { router: { pathname: AppRoutes.transactions.history } } },
  decorators: [withRouter(AppRoutes.transactions.history)],
}

// ---------------------------------------------------------------------------
// Queue rows, one per transaction type. Same nonce block, same 1/3 badge, same
// Confirm button, so only the type and amount cells differ between them.
// ---------------------------------------------------------------------------

/** The reference row. Every other type should line up with this one. */
export const SendNativeToken: Story = {
  name: 'Queue - send native token',
  args: { item: queueNativeTransfer },
  render: asRow(),
}

export const SendErc20: Story = {
  name: 'Queue - send ERC-20',
  args: { item: queueErc20Transfer },
  render: asRow(),
}

/** Sell order: the sell side carries the amount, the buy side only a symbol. */
export const SwapSellOrder: Story = {
  name: 'Queue - swap (sell order)',
  args: { item: queueSwapSellOrder },
  render: asRow(),
}

/** Buy order: the sides swap roles, so the amount lands after the "to". */
export const SwapBuyOrder: Story = {
  name: 'Queue - swap (buy order)',
  args: { item: queueSwapBuyOrder },
  render: asRow(),
}

export const SettingsChange: Story = {
  name: 'Queue - settings change',
  args: { item: queueSettingsChange },
  render: asRow(),
}

export const Batch: Story = {
  name: 'Queue - batch',
  args: { item: queueMultiSend },
  render: asRow(),
}

export const CustomTransaction: Story = {
  name: 'Queue - custom transaction',
  args: { item: queueCustom },
  render: asRow(),
}

/** Long symbols on both sides and an 8-figure amount — where the swap cell truncates. */
export const SwapOrderWithLongSymbols: Story = {
  name: 'Queue - swap with long symbols',
  args: { item: queueLongSwapOrder },
  render: asRow(),
}

// ---------------------------------------------------------------------------
// History rows: fewer columns (no confirmations, no actions), a status instead.
// ---------------------------------------------------------------------------

export const HistorySendNativeToken: Story = {
  name: 'History - send native token',
  args: { item: historyNativeTransfer },
  ...historyRoute,
  render: asRow(),
}

export const HistorySwapOrder: Story = {
  name: 'History - swap (sell order)',
  args: { item: historySwapSellOrder },
  ...historyRoute,
  render: asRow(),
}

// ---------------------------------------------------------------------------
// The comparison stories: several types stacked, so a row that is taller than
// its neighbours or a cell that fails to line up is obvious at a glance.
// ---------------------------------------------------------------------------

/** The most useful story here: every queue type in one list at full width. */
export const AllTypesStacked: Story = {
  name: 'All types stacked (queue)',
  render: () => <TxCardStack items={queueAllTypes} />,
}

export const AllTypesStackedHistory: Story = {
  name: 'All types stacked (history)',
  ...historyRoute,
  render: () => <TxCardStack items={historyAllTypes} />,
}

// ---------------------------------------------------------------------------
// Container widths. 1000px keeps the one-line grid, 600px crosses the 680px
// query into the two-row template, 360px crosses 380px into the phone row.
// ---------------------------------------------------------------------------

export const AllTypesStackedAt1000: Story = {
  name: 'All types stacked - 1000px',
  render: () => <TxCardStack items={queueAllTypes} width={1000} />,
}

export const AllTypesStackedAt600: Story = {
  name: 'All types stacked - 600px',
  render: () => <TxCardStack items={queueAllTypes} width={600} />,
}

export const AllTypesStackedAt360: Story = {
  name: 'All types stacked - 360px',
  render: () => <TxCardStack items={queueAllTypes} width={360} />,
}

export const SendAt1000: Story = {
  name: 'Send - 1000px',
  args: { item: queueNativeTransfer },
  render: asRow(1000),
}

export const SendAt600: Story = {
  name: 'Send - 600px',
  args: { item: queueNativeTransfer },
  render: asRow(600),
}

export const SendAt360: Story = {
  name: 'Send - 360px',
  args: { item: queueNativeTransfer },
  render: asRow(360),
}

export const SwapAt1000: Story = {
  name: 'Swap - 1000px',
  args: { item: queueSwapSellOrder },
  render: asRow(1000),
}

export const SwapAt600: Story = {
  name: 'Swap - 600px',
  args: { item: queueSwapSellOrder },
  render: asRow(600),
}

export const SwapAt360: Story = {
  name: 'Swap - 360px',
  args: { item: queueSwapSellOrder },
  render: asRow(360),
}
