import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import FiatValue from './index'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  component: FiatValue,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{ settings: { currency: 'usd' } }}>
        <Paper sx={{ padding: 2 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof FiatValue>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: '1234.56',
  },
}

export const LargeValue: Story = {
  args: {
    value: '1234567.89',
  },
}

export const SmallValue: Story = {
  args: {
    value: '0.0001234',
  },
}

export const WithMaxLength: Story = {
  args: {
    value: '123456789.123456',
    maxLength: 10,
  },
}

export const Precise: Story = {
  args: {
    value: '1234.567890',
    precise: true,
  },
}

export const NullValue: Story = {
  args: {
    value: null,
  },
}

export const NumberValue: Story = {
  args: {
    value: 9999.99,
  },
}

export const ZeroValue: Story = {
  args: {
    value: '0',
  },
}
