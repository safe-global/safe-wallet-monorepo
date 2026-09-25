import type { Meta, StoryObj } from '@storybook/react'
import SafeProHero from './index'

const meta = {
  title: 'Components/Common/SafeProHero',
  component: SafeProHero,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-[640px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafeProHero>

export default meta
type Story = StoryObj<typeof meta>

export const Wide: Story = { args: { variant: 'wide' } }

export const Tall: Story = { args: { variant: 'tall' } }

export const Compact: Story = { args: { variant: 'compact' } }
