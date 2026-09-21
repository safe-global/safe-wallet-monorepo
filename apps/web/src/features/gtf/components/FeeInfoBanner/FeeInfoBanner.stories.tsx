import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import FeeInfoBanner from './index'

const meta = {
  title: 'Features/GTF/FeeInfoBanner',
  component: FeeInfoBanner,
  tags: ['autodocs'],
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{}} context={context}>
        <Story />
      </StoreDecorator>
    ),
  ],
} satisfies Meta<typeof FeeInfoBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
