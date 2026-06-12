import type { Meta, StoryObj } from '@storybook/react'
import InitialsAvatar from './index'

const meta: Meta<typeof InitialsAvatar> = {
  component: InitialsAvatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'Safe Team',
  },
}

export const AllSizes: Story = {
  args: {
    name: 'Safe',
  },
  render: ({ name }) => (
    <div className="flex items-center gap-4">
      <InitialsAvatar name={name} size="xsmall" />
      <InitialsAvatar name={name} size="small" />
      <InitialsAvatar name={name} size="medium" />
      <InitialsAvatar name={name} size="large" />
    </div>
  ),
}

export const XSmall: Story = {
  args: {
    name: 'Safe Team',
    size: 'xsmall',
  },
}

export const Small: Story = {
  args: {
    name: 'Safe Team',
    size: 'small',
  },
}

export const Medium: Story = {
  args: {
    name: 'Safe Team',
    size: 'medium',
  },
}

export const Large: Story = {
  args: {
    name: 'Safe Team',
    size: 'large',
  },
}

export const Rounded: Story = {
  args: {
    name: 'Safe Team',
    rounded: true,
  },
}

export const DifferentNames: Story = {
  args: {
    name: 'Alice',
  },
  render: () => (
    <div className="flex items-center gap-4">
      <InitialsAvatar name="Alice" />
      <InitialsAvatar name="Bob" />
      <InitialsAvatar name="Charlie" />
      <InitialsAvatar name="Diana" />
      <InitialsAvatar name="Eve" />
    </div>
  ),
}
