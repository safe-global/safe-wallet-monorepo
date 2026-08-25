import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import SafeProWorkspacesBanner from './index'

const meta = {
  component: SafeProWorkspacesBanner,
  title: 'Features/SafePro/SafeProWorkspacesBanner',
  tags: ['autodocs'],
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{}} context={context}>
        <div className="flex justify-center bg-background p-6">
          <div className="w-full max-w-[991px]">
            <Story />
          </div>
        </div>
      </StoreDecorator>
    ),
  ],
} satisfies Meta<typeof SafeProWorkspacesBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
