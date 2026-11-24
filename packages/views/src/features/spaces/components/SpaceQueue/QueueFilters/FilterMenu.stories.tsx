import type { Meta, StoryObj } from '@storybook/react'
import { fn, screen, userEvent, within } from 'storybook/test'
import FilterMenu from './FilterMenu'

const meta = {
  title: 'Features/Spaces/Transactions/QueueFilters/FilterMenu',
  component: FilterMenu,
  parameters: { layout: 'centered' },
  args: {
    status: {
      statuses: ['execute', 'sign', 'blocked', 'waiting'],
      flags: ['conflicting', 'stale'],
      counts: { execute: 1, sign: 10, blocked: 7, waiting: 1, conflicting: 2, stale: 0 },
      selected: [],
      onToggle: fn(),
    },
    safe: {
      options: [
        { safeAddress: '0x1111111111111111111111111111111111111111', name: 'Treasury', count: 11, checked: false },
      ],
      onToggle: fn(),
    },
    network: {
      options: [
        { chainId: '1', name: 'Ethereum', count: 12, checked: false },
        { chainId: '137', name: 'Polygon', count: 3, checked: false },
      ],
      onToggle: fn(),
    },
    signer: {
      options: [{ address: '0x3333333333333333333333333333333333333333', name: 'Alice', count: 10, checked: false }],
      onToggle: fn(),
    },
  },
} satisfies Meta<typeof FilterMenu>

export default meta
type Story = StoryObj<typeof meta>

const openSubmenu =
  (name: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Filter' }))
    await userEvent.click(await screen.findByRole('menuitem', { name }))
    await screen.findAllByRole('menuitemcheckbox')
  }

export const Urgency: Story = { play: openSubmenu('Urgency') }

export const SafeAccount: Story = { play: openSubmenu('Safe account') }

export const Network: Story = { play: openSubmenu('Network') }

export const Signer: Story = { play: openSubmenu('Signer') }
