import type { Meta, StoryObj } from '@storybook/react'
import { TagChip, TagChips } from './TagChip'

const meta = {
  title: 'Features/Spaces/AddressBookV2/Tags',
  component: TagChip,
  parameters: { layout: 'padded' },
  args: { name: 'Vendor', color: 'cobalt' },
} satisfies Meta<typeof TagChip>

export default meta
type Story = StoryObj<typeof meta>

export const Chip: Story = {}

/** The eight colours CGW assigns. */
export const AllColours: Story = {
  render: () => (
    <TagChips
      tags={(['slate', 'clay', 'rose', 'lilac', 'iris', 'cobalt', 'sky', 'lagoon'] as const).map((color) => ({
        name: color.charAt(0).toUpperCase() + color.slice(1),
        color,
      }))}
    />
  ),
}
