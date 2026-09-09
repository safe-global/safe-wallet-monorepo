import type { Meta, StoryObj } from '@storybook/react'
import SafeProSidebarBanner from './index'

const meta = {
  component: SafeProSidebarBanner,
  title: 'Features/SafePro/SafeProSidebarBanner',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex justify-center bg-sidebar p-6">
        {/* The real sidebar content column */}
        <div className="w-[226px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof SafeProSidebarBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
