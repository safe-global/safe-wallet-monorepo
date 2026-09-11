import type { Meta, StoryObj } from '@storybook/react'
import { Search, Bell, Layers } from 'lucide-react'
import IconAction from './index'

/**
 * IconAction — the compact icon-only top-bar / header action. Locks
 * `variant="ghost"`, `size="icon-sm"` and the margin so every top-bar icon matches.
 */
const meta = {
  title: 'Components/Common/IconAction',
  component: IconAction,
} satisfies Meta<typeof IconAction>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Top-bar icon actions</h3>
      <div className="flex items-center">
        <IconAction aria-label="Search" onClick={() => {}}>
          <Search className="size-5 text-muted-foreground" />
        </IconAction>
        <IconAction aria-label="Notifications" onClick={() => {}}>
          <Bell className="size-5 text-muted-foreground" />
        </IconAction>
        <IconAction aria-label="Batch" onClick={() => {}}>
          <Layers className="size-5 text-muted-foreground" />
        </IconAction>
      </div>
    </div>
  ),
}
