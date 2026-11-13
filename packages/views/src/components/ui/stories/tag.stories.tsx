import type { Meta, StoryObj } from '@storybook/react'
import { ArrowUpRight, Settings } from 'lucide-react'
import { Tag } from '../tag'

const COLORS = ['default', 'slate', 'clay', 'rose', 'orchid', 'lilac', 'iris', 'cobalt', 'sky', 'lagoon'] as const

/**
 * Tag Component Stories
 *
 * Figma: Mint Refresh colour system, Tag (node 5-118).
 */
const meta = {
  title: 'UI/Tag',
  component: Tag,
  argTypes: { color: { control: 'select', options: COLORS } },
  args: { children: 'Treasury' },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Colors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <Tag key={color} color={color}>
          {color}
        </Tag>
      ))}
    </div>
  ),
}

/** Transaction types: an icon and the type, in the default colour. */
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag>
        <ArrowUpRight /> Send
      </Tag>
      <Tag>
        <Settings /> Settings
      </Tag>
    </div>
  ),
}
