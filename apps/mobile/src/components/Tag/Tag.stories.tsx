import type { StoryObj, Meta } from '@storybook/react'
import { Tag } from '@/src/components/Tag'

const meta: Meta<typeof Tag> = {
  title: 'Tag',
  component: Tag,
}

export default meta

type Story = StoryObj<typeof Tag>

export const Default: Story = {
  render: () => <Tag>default</Tag>,
}

export const Error: Story = {
  render: () => <Tag error>error</Tag>,
}

export const Warning: Story = {
  render: () => <Tag warning>warning</Tag>,
}

export const Success: Story = {
  render: () => <Tag success>success</Tag>,
}

export const Outline: Story = {
  render: () => <Tag outlined>outline</Tag>,
}
