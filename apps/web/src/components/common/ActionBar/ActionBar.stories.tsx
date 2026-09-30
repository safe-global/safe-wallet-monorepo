import type { Meta, StoryObj } from '@storybook/react'
import { ArrowUpRight, ArrowDownLeft, Repeat } from 'lucide-react'
import { ActionBar, ActionButton } from './index'

/**
 * ActionBar + ActionButton — the canonical CTA / action-bar row.
 * ActionBar owns the layout (gap, wrapping); ActionButton locks the prominent
 * `size="action"` pill. Variant carries the emphasis (one `default` primary).
 */
const meta = {
  title: 'Components/Common/ActionBar',
  component: ActionBar,
} satisfies Meta<typeof ActionBar>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Action bar (CTA row)</h3>
        <ActionBar>
          <ActionButton variant="default" onClick={() => {}}>
            <ArrowUpRight className="text-green-400" />
            Send
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => {}}>
            <ArrowDownLeft />
            Receive
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => {}}>
            <Repeat strokeWidth={1.5} />
            Swap
          </ActionButton>
        </ActionBar>
        <p className="mt-2 text-sm text-muted-foreground">
          On white/card surfaces the secondary actions use <code>variant=&quot;secondary&quot;</code>; on the muted page
          background use <code>variant=&quot;outline&quot;</code> so they stay visible.
        </p>
      </div>
    </div>
  ),
}
