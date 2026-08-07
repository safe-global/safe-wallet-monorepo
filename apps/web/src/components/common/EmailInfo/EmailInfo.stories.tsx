import type { Meta, StoryObj } from '@storybook/react'
import { Box, Stack } from '@mui/material'
import EmailInfo from './index'

const meta: Meta<typeof EmailInfo> = {
  component: EmailInfo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    email: 'alice@example.com',
  },
}

export const WithTooltip: Story = {
  args: {
    email: 'alice@example.com',
    showTooltip: true,
  },
}

export const LongEmailTruncated: Story = {
  args: {
    email: 'a-very-long-address-that-will-not-fit@some-very-long-domain.example.com',
  },
  render: (args) => (
    <Box width={240}>
      <EmailInfo {...args} />
    </Box>
  ),
}

export const SquareAvatar: Story = {
  args: {
    email: 'bob@example.com',
    rounded: false,
  },
}

export const AllSizes: Story = {
  args: {
    email: 'alice@example.com',
  },
  render: ({ email }) => (
    <Stack spacing={2} alignItems="flex-start">
      <EmailInfo email={email} size="xsmall" />
      <EmailInfo email={email} size="small" />
      <EmailInfo email={email} size="medium" />
      <EmailInfo email={email} size="large" />
    </Stack>
  ),
}

export const EmptyEmail: Story = {
  args: {
    email: '',
  },
  render: (args) => (
    <Box width={240}>
      <EmailInfo {...args} />
    </Box>
  ),
}

export const WhitespaceOnly: Story = {
  args: {
    email: '   ',
  },
  render: (args) => (
    <Box width={240}>
      <EmailInfo {...args} />
    </Box>
  ),
}
