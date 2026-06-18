import type { Meta, StoryObj } from '@storybook/react'
import { SafeNodeContent } from './SafeNode'
import type { SafeNodeData } from './useNestedSafesGraph'

const base: SafeNodeData = {
  address: '0xAAa0000000000000000000000000000000000001',
  name: 'Treasury',
  isSpaceMember: true,
  trust: 'trusted',
  isCurrent: false,
  fiatTotal: '$1.24M',
}

const meta = {
  title: 'Features/Spaces/NestedSafesGraph/SafeNode',
  component: SafeNodeContent,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafeNodeContent>

export default meta
type Story = StoryObj<typeof meta>

export const Member: Story = { args: { data: base } }
export const Current: Story = { args: { data: { ...base, isCurrent: true } } }
export const Discovered: Story = {
  args: { data: { ...base, name: null, isSpaceMember: false, trust: 'unknown' } },
}
export const Suspicious: Story = { args: { data: { ...base, trust: 'suspicious' } } }
