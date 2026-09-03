import type { Meta, StoryObj } from '@storybook/react'
import SafeProBanner from './index'

const meta = {
  component: SafeProBanner,
  title: 'Features/SafePro/SafeProBanner',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex justify-center bg-background p-6">
        <div className="w-full max-w-[440px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof SafeProBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
