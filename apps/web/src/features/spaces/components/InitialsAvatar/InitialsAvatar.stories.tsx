import type { Meta, StoryObj } from '@storybook/react'
import { Stack } from '@mui/material'
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
  render: (args) => (
    <Stack direction="row" spacing={2} alignItems="center">
      <InitialsAvatar {...args} size="xsmall" />
      <InitialsAvatar {...args} size="small" />
      <InitialsAvatar {...args} size="medium" />
      <InitialsAvatar {...args} size="large" />
    </Stack>
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
    <Stack direction="row" spacing={2} alignItems="center">
      <InitialsAvatar name="Alice" />
      <InitialsAvatar name="Bob" />
      <InitialsAvatar name="Charlie" />
      <InitialsAvatar name="Diana" />
      <InitialsAvatar name="Eve" />
    </Stack>
  ),
}
