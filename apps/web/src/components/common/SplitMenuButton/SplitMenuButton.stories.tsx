import type { Meta, StoryObj } from '@storybook/react'
import { Box } from '@mui/material'
import SplitMenuButton from './index'

const meta = {
  component: SplitMenuButton,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Box sx={{ width: 300 }}>
        <Story />
      </Box>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SplitMenuButton>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { id: 'execute', label: 'Execute' },
  { id: 'sign', label: 'Sign' },
  { id: 'reject', label: 'Reject' },
]

export const Default: Story = {
  args: {
    options,
    onClick: (option) => console.log('clicked', option),
    onChange: (option) => console.log('changed', option),
  },
}

export const WithSelectedOption: Story = {
  args: {
    options,
    selected: 'sign',
    onClick: (option) => console.log('clicked', option),
    onChange: (option) => console.log('changed', option),
  },
}

export const Disabled: Story = {
  args: {
    options,
    disabled: true,
    onClick: (option) => console.log('clicked', option),
  },
}

export const Loading: Story = {
  args: {
    options,
    loading: true,
    onClick: (option) => console.log('clicked', option),
  },
}

export const WithTooltip: Story = {
  args: {
    options,
    tooltip: 'Choose an action to perform',
    onClick: (option) => console.log('clicked', option),
  },
}

export const WithDisabledOption: Story = {
  args: {
    options,
    disabledIndex: 2,
    onClick: (option) => console.log('clicked', option),
    onChange: (option) => console.log('changed', option),
  },
}

export const SingleOption: Story = {
  args: {
    options: [{ id: 'submit', label: 'Submit' }],
    onClick: (option) => console.log('clicked', option),
  },
}
