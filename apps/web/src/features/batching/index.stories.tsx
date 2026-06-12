import type { Meta, StoryObj } from '@storybook/react'
import { Layers } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

/**
 * Batch components allow users to queue multiple transactions together
 * for efficient execution as a single multi-send transaction.
 *
 * This story showcases the batch UI patterns used throughout the app.
 * Note: Actual BatchIndicator and BatchSidebar require Redux store context.
 */
const meta: Meta = {
  title: 'Features/Batching',
  parameters: {
    layout: 'centered',
  },
}

export default meta

// BatchIndicator mockup (actual component requires useDraftBatch hook)
const MockBatchIndicator = ({ count = 0 }: { count?: number }) => (
  <Button variant="ghost" size="icon" title="Batch" className="relative">
    <Layers className="size-6" />
    {count > 0 && (
      <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-secondary px-1 text-xs font-medium text-secondary-foreground">
        {count}
      </span>
    )}
  </Button>
)

// Combined view showing both components - FULL PAGE FIRST
export const FullBatchUI: StoryObj = {
  render: () => (
    <div className="flex items-start gap-8">
      <div className="rounded-lg bg-background p-4">
        <Typography variant="paragraph-small-bold" as="div" className="mb-2">
          Indicator
        </Typography>
        <MockBatchIndicator count={3} />
      </div>
      <div className="min-h-[300px] w-[350px] rounded-lg bg-background p-4">
        <Typography variant="paragraph-small-bold" as="div" className="border-b pb-4">
          Sidebar preview
        </Typography>
        <div className="pt-4">
          {[
            { type: 'Send', amount: '1.5 ETH' },
            { type: 'Approve', amount: '1000 USDC' },
            { type: 'Send', amount: '500 DAI' },
          ].map((tx, i) => (
            <div key={i} className="border-b py-2">
              <Typography variant="paragraph-small">
                {tx.type}: {tx.amount}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Full batch UI showing both the indicator button and the sidebar panel.',
      },
    },
  },
}

export const Indicator: StoryObj = {
  render: () => (
    <div className="rounded bg-background p-4">
      <Typography variant="paragraph-mini" color="muted" as="div" className="mb-4">
        BatchIndicator shows the number of pending transactions
      </Typography>
      <div className="flex gap-6">
        <div className="text-center">
          <MockBatchIndicator count={0} />
          <Typography variant="paragraph-mini" as="div">
            Empty
          </Typography>
        </div>
        <div className="text-center">
          <MockBatchIndicator count={3} />
          <Typography variant="paragraph-mini" as="div">
            3 items
          </Typography>
        </div>
        <div className="text-center">
          <MockBatchIndicator count={12} />
          <Typography variant="paragraph-mini" as="div">
            12 items
          </Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The BatchIndicator displays a badge with the count of queued transactions.',
      },
    },
  },
}

// BatchSidebar mockup
export const SidebarEmpty: StoryObj = {
  render: () => (
    <div className="min-h-[400px] w-[400px] rounded-lg bg-background p-6">
      <Typography variant="h4" className="mb-2">
        Batch transaction
      </Typography>
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Layers className="mb-4 size-12 opacity-50" />
        <Typography variant="paragraph" color="muted">
          No transactions in batch
        </Typography>
        <Typography variant="paragraph-small" color="muted" className="mt-2">
          Add transactions to execute them together
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BatchSidebar when no transactions are queued shows an empty state.',
      },
    },
  },
}

export const SidebarWithItems: StoryObj = {
  render: () => (
    <div className="min-h-[400px] w-[400px] rounded-lg bg-background p-6">
      <Typography variant="h4" className="mb-2">
        Batch transaction (3)
      </Typography>
      <div className="flex flex-col gap-4">
        {[
          { type: 'Send', amount: '1.5 ETH', to: '0x1234...5678' },
          { type: 'Approve', amount: '1000 USDC', to: 'Uniswap' },
          { type: 'Send', amount: '500 DAI', to: '0xABCD...EFGH' },
        ].map((tx, i) => (
          <div key={i} className="flex justify-between rounded border p-4">
            <div>
              <Typography variant="paragraph-small-bold" as="div">
                {tx.type}
              </Typography>
              <Typography variant="paragraph-mini" color="muted">
                {tx.amount} → {tx.to}
              </Typography>
            </div>
            <Typography variant="paragraph-mini" className="cursor-pointer text-destructive">
              Remove
            </Typography>
          </div>
        ))}
      </div>
      <Separator className="my-6" />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">
          Clear all
        </Button>
        <div className="flex-1" />
        <Button size="sm">Execute batch</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BatchSidebar with queued transactions ready for batch execution.',
      },
    },
  },
}
