import type { Meta, StoryObj } from '@storybook/react'
import FiatValue from './index'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  title: 'Components/Common/FiatValue',
  component: FiatValue,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{ settings: { currency: 'usd' } }}>
        <div className="rounded-lg bg-[var(--color-background-paper)] p-4">
          <Story />
        </div>
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
  tags: ['skip-visual-test'],
  args: {
    value: '1234567.89',
  },
}

export const SmallValue: Story = {
  tags: ['skip-visual-test'],
  args: {
    value: '0.0001234',
  },
}

export const WithMaxLength: Story = {
  tags: ['skip-visual-test'],
  args: {
    value: '123456789.123456',
    maxLength: 10,
  },
}

export const Precise: Story = {
  tags: ['skip-visual-test'],
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
  tags: ['skip-visual-test'],
  args: {
    value: 9999.99,
  },
}

export const ZeroValue: Story = {
  tags: ['skip-visual-test'],
  args: {
    value: '0',
  },
}
