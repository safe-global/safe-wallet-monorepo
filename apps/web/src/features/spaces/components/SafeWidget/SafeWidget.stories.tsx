import type { Meta, StoryObj } from '@storybook/react'
import { ChevronRight, Plus, WalletCards } from 'lucide-react'
import SafeWidget from './index'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

/**
 * SafeWidget - Compound component for Space dashboard widgets.
 *
 * Uses a parent container (`SafeWidget`) with namespaced subcomponents
 * (`SafeWidget.Item`, `SafeWidget.Footer`) for flexible composition.
 *
 * Figma:
 * - Pending: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/?node-id=7524-21913
 * - Pending (with networks): https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/?node-id=7524-19575
 * - Accounts: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/?node-id=7524-19574
 * - Assets: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/?node-id=7524-21912
 */

const meta: Meta<typeof SafeWidget> = {
  component: SafeWidget,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: 'var(--color-background-default, #f4f4f4)', padding: '2rem' }}>
        <div style={{ maxWidth: '560px' }}>
          <Story />
        </div>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Assets: Story = {
  render: () => (
    <SafeWidget
      title="Assets"
      action={
        <Button variant="ghost" size="icon-sm">
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      <SafeWidget.Item
        label="Ether"
        info="19,188.40 ETH"
        startNode={
          <Avatar>
            <AvatarImage src="https://safe-transaction-assets.safe.global/chains/1/chain_logo.png" alt="Ether" />
            <AvatarFallback>ETH</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$39.95M</span>}
      />
      <SafeWidget.Item
        label="Gnosis"
        info="8,40213 GNO"
        startNode={
          <Avatar>
            <AvatarImage src="https://safe-transaction-assets.safe.global/chains/100/chain_logo.png" alt="Gnosis" />
            <AvatarFallback>GNO</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$9,4589</span>}
      />
      <SafeWidget.Item
        label="SAFE Token"
        info="2,188.40 SAFE"
        startNode={
          <Avatar>
            <AvatarImage
              src="https://safe-transaction-assets.safe.global/tokens/logos/0x5aFE3855358E112B5647B952709E6165e1c1eEEe.png"
              alt="SAFE"
            />
            <AvatarFallback className="bg-[#f0fdf4] text-xs font-semibold">SA</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$1.12M</span>}
      />
      <SafeWidget.Footer count={14} text="View all assets" />
    </SafeWidget>
  ),
}

export const EmptyState: Story = {
  render: () => (
    <SafeWidget title="Accounts">
      <SafeWidget.EmptyState
        icon={<WalletCards className="size-6 text-[#22C55E]" />}
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
    </SafeWidget>
  ),
}

export const ErrorState: Story = {
  render: () => (
    <SafeWidget title="Accounts">
      <SafeWidget.ErrorState message="Failed to load accounts" onRefresh={() => console.log('Refresh')} />
    </SafeWidget>
  ),
}

export const ErrorStateWithoutRefresh: Story = {
  render: () => (
    <SafeWidget title="Assets">
      <SafeWidget.ErrorState message="Something went wrong" />
    </SafeWidget>
  ),
}

/**
 * Two widgets side by side — one with a large action button, one without.
 * The titles must sit on the same line (the title row reserves the action height).
 */
export const SideBySideHeaderAlignment: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <SafeWidget
        title="Accounts"
        action={
          <Button size="lg" variant="outline" className="font-normal px-4 py-0">
            <Plus className="size-4" />
            Manage accounts
          </Button>
        }
      >
        <SafeWidget.Item label="Test Safe One" info="0x9483...fd61" />
      </SafeWidget>
      <SafeWidget title="Pending">
        <SafeWidget.Item label="changeThreshold" info="about 2 hours ago" />
      </SafeWidget>
    </div>
  ),
}

export const WithoutActionAndFooter: Story = {
  render: () => (
    <SafeWidget title="Assets">
      <SafeWidget.Item
        label="Ether"
        info="19,188.40 ETH"
        startNode={
          <Avatar>
            <AvatarImage src="https://safe-transaction-assets.safe.global/chains/1/chain_logo.png" alt="Ether" />
            <AvatarFallback>ETH</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$39.95M</span>}
      />
      <SafeWidget.Item
        label="Gnosis"
        info="8,40213 GNO"
        startNode={
          <Avatar>
            <AvatarImage src="https://safe-transaction-assets.safe.global/chains/100/chain_logo.png" alt="Gnosis" />
            <AvatarFallback>GNO</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$9,4589</span>}
      />
      <SafeWidget.Item
        label="SAFE Token"
        info="2,188.40 SAFE"
        startNode={
          <Avatar>
            <AvatarImage
              src="https://safe-transaction-assets.safe.global/tokens/logos/0x5aFE3855358E112B5647B952709E6165e1c1eEEe.png"
              alt="SAFE"
            />
            <AvatarFallback className="bg-[#f0fdf4] text-xs font-semibold">SA</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm cursor-pointer font-medium text-muted-foreground">$1.12M</span>}
      />
    </SafeWidget>
  ),
}
