import type { Meta, StoryObj } from '@storybook/react'
import { Chip } from '../chip'

const meta = {
  title: 'UI/Chip',
  component: Chip,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'primary'],
    },
  },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Default' },
}

export const Removable: Story = {
  args: { children: 'Removable', onDelete: () => {} },
}

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Chip variant="default">Default</Chip>
      <Chip variant="outline">Outline</Chip>
      <Chip variant="primary">Primary</Chip>
      <Chip variant="outline" onDelete={() => {}}>
        Removable
      </Chip>
    </div>
  ),
}
