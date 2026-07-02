import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import BatchTooltip from './index'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'

/**
 * BatchTooltip Stories
 *
 * A notification tooltip that appears when a transaction is added to the batch.
 * It listens for the `TxEvent.BATCH_ADD` event on the in-memory tx event bus and
 * shows a success popover anchored to its child. Dismisses on any click.
 *
 * The stories below wrap the tooltip around a visible anchor and drive it with
 * `txDispatch(TxEvent.BATCH_ADD, …)` — the exact signal the batching flow emits
 * in the real app.
 */
const meta = {
  title: 'Features/Batching/BatchTooltip',
  component: BatchTooltip,
  parameters: {
    // The popover position depends on the anchor's on-screen coordinates, which
    // are not stable in the Chromatic snapshot environment.
    chromatic: { disable: true },
  },
} satisfies Meta<typeof BatchTooltip>

export default meta
type Story = StoryObj<typeof meta>

const BatchIndicator = () => (
  <div className="border-border bg-background inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
    Batch
    <span className="bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full text-xs">
      3
    </span>
  </div>
)

/**
 * The tooltip stays hidden until a transaction is added to the batch. Click the
 * "Add to batch" button to dispatch the event and reveal the notification.
 */
export const Default: Story = {
  args: {
    children: <BatchIndicator />,
  },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <BatchTooltip>
        <BatchIndicator />
      </BatchTooltip>
      <button
        type="button"
        className="border-border rounded-md border px-3 py-2 text-sm font-medium"
        onClick={() => txDispatch(TxEvent.BATCH_ADD, { txId: '0x-story-tx', nonce: 0 })}
      >
        Add to batch
      </button>
    </div>
  ),
}

/**
 * The notification as it looks right after a transaction is added — dispatched
 * automatically on mount so the popover is visible without interaction.
 */
export const Shown: Story = {
  args: {
    children: <BatchIndicator />,
  },
  render: () => {
    useEffect(() => {
      const id = setTimeout(() => txDispatch(TxEvent.BATCH_ADD, { txId: '0x-story-tx', nonce: 0 }), 0)
      return () => clearTimeout(id)
    }, [])

    return (
      <div className="pb-40">
        <BatchTooltip>
          <BatchIndicator />
        </BatchTooltip>
      </div>
    )
  },
}
