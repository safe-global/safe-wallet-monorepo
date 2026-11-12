import type { Meta, StoryObj } from '@storybook/react'
import { ChevronRight, Plus, WalletCards } from 'lucide-react'
import { Avatar, AvatarFallback } from '../../primitives/avatar/avatar'
import { Badge } from '../../primitives/badge/badge'
import { Button } from '../../primitives/button/button'
import {
  Widget,
  WidgetEmptyState,
  WidgetErrorState,
  WidgetFooter,
  WidgetItem,
  WidgetItemSkeleton,
  WidgetViewAll,
} from './widget'

/**
 * A dashboard card with a title row and a stack of rows. Compose `WidgetItem` rows with the loading, empty and
 * error states and an overflow `WidgetFooter` or `WidgetViewAll`.
 */
const meta = {
  title: 'Safe UI/Widget',
  component: Widget,
  decorators: [
    (Story) => (
      <div className="bg-background p-8">
        <div className="max-w-[560px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Widget>

export default meta
type Story = StoryObj<typeof meta>

/** Asset rows with a leading avatar, a value in the action slot and a `+N` footer. */
export const Assets: Story = {
  args: { title: 'Assets' },
  render: () => (
    <Widget
      title="Assets"
      action={
        <Button variant="ghost" size="icon-sm" aria-label="Open assets">
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      <WidgetItem
        label="Ether"
        info="19,188.40 ETH"
        startNode={
          <Avatar>
            <AvatarFallback>ETH</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$39.95M</span>}
      />
      <WidgetItem
        label="Gnosis"
        info="8,402.13 GNO"
        startNode={
          <Avatar>
            <AvatarFallback>GNO</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$945.89K</span>}
      />
      <WidgetItem
        label="Safe Token"
        info="2,188.40 SAFE"
        startNode={
          <Avatar>
            <AvatarFallback className="bg-accent text-xs font-semibold">SA</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$1.12M</span>}
      />
      <WidgetFooter count={14} text="View all assets" onClick={() => console.log('View all assets')} />
    </Widget>
  ),
}

/** Clickable transaction rows with a description line, a status badge and an action. */
export const Pending: Story = {
  args: { title: 'Pending' },
  render: () => (
    <Widget title="Pending" action={<WidgetViewAll count={3} onClick={() => console.log('View all')} />}>
      <WidgetItem
        label="Send"
        description="1.5 ETH to Payroll"
        info="Treasury · 2 of 3 signatures"
        featuredNode={<Badge variant="warning">Needs signature</Badge>}
        actionNode={
          <Button size="sm" variant="secondary">
            Sign
          </Button>
        }
        onClick={() => console.log('Open transaction')}
      />
      <WidgetItem
        label="Add signer"
        description="Signer setup: 3 of 4"
        info="Operations · 1 of 3 signatures"
        actionNode={
          <Button size="sm" variant="secondary">
            Sign
          </Button>
        }
        onClick={() => console.log('Open transaction')}
      />
    </Widget>
  ),
}

/** `WidgetViewAll` in the title row and a highlighted row. */
export const Accounts: Story = {
  args: { title: 'Accounts' },
  render: () => (
    <Widget title="Accounts" action={<WidgetViewAll count={14} onClick={() => console.log('View all')} />}>
      <WidgetItem
        label="Treasury"
        info="0x8675…bca19b"
        highlighted
        startNode={
          <Avatar>
            <AvatarFallback className="bg-accent text-xs font-semibold">TR</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$123.72K</span>}
      />
      <WidgetItem
        label="Payroll"
        info="0x5afe…c0ffee"
        startNode={
          <Avatar>
            <AvatarFallback className="bg-accent text-xs font-semibold">PA</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$48.10K</span>}
      />
    </Widget>
  ),
}

/** Skeleton rows while the data loads. */
export const Loading: Story = {
  args: { title: 'Accounts' },
  render: () => (
    <Widget title="Accounts">
      <WidgetItemSkeleton />
      <WidgetItemSkeleton />
      <WidgetItemSkeleton />
    </Widget>
  ),
}

/** The empty state with an animated icon, a subtitle and an action. */
export const EmptyState: Story = {
  args: { title: 'Accounts' },
  render: () => (
    <Widget title="Accounts">
      <WidgetEmptyState
        icon={<WalletCards className="size-6 text-badge-dot-success" />}
        iconContainerClassName="bg-accent"
        text="No accounts yet"
        subtitle="Add your Safe accounts to view balances and manage transactions."
        action={
          <Button size="sm">
            <Plus className="size-4" />
            Add account
          </Button>
        }
      />
    </Widget>
  ),
}

/** The error state; the reload button appears with `onRefresh`. */
export const ErrorState: Story = {
  args: { title: 'Accounts' },
  render: () => (
    <Widget title="Accounts">
      <WidgetErrorState message="Failed to load accounts" onRefresh={() => console.log('Refresh')} />
    </Widget>
  ),
}
