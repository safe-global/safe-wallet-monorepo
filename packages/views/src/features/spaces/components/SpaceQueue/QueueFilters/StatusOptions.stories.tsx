import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, screen } from 'storybook/test'
import StatusOptions from './StatusOptions'
import { InOpenMenu } from './storyDecorators'

const meta = {
  title: 'Features/Spaces/Transactions/QueueFilters/StatusOptions',
  component: StatusOptions,
  parameters: { layout: 'centered' },
  decorators: [InOpenMenu],
  args: {
    statuses: ['execute', 'sign', 'blocked', 'waiting'],
    flags: ['conflicting', 'stale'],
    counts: { execute: 1, sign: 10, blocked: 7, waiting: 1, conflicting: 2, stale: 0 },
    selected: [],
    onToggle: fn(),
  },
} satisfies Meta<typeof StatusOptions>

export default meta
type Story = StoryObj<typeof meta>

/** Statuses sit on a tinted tile, flags get a muted icon. */
export const Default: Story = {
  play: async () => {
    const options = await screen.findAllByRole('menuitemcheckbox')
    const icons = options.map((option) => option.querySelector('svg.lucide'))
    await expect(icons[0]?.parentElement).toHaveClass('bg-success-subtle', 'text-success-strong')
    await expect(icons[1]?.parentElement).toHaveClass('bg-success-subtle', 'text-success-strong')
    await expect(icons[2]?.parentElement).toHaveClass('bg-warning-subtle', 'text-warning-strong')
    await expect(icons[3]?.parentElement).toHaveClass('bg-warning-subtle', 'text-warning-strong')
    await expect(icons[4]).toHaveClass('text-muted-foreground')
    await expect(icons[5]).toHaveClass('text-muted-foreground')
  },
}

/** A status is selected, so the flags show no count. */
export const StatusSelected: Story = {
  args: {
    selected: ['sign'],
    counts: { execute: 1, sign: 10, blocked: 7, waiting: 1 },
  },
}
