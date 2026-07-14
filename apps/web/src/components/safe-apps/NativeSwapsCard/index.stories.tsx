import type { Meta, StoryObj } from '@storybook/react'
import NativeSwapsCard from './index'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  title: 'Components/SafeApps/NativeSwapsCard',
  component: NativeSwapsCard,
  parameters: {
    componentSubtitle: 'Renders a promo card for native swaps',
  },

  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{ chains: { data: [{ chainId: '11155111', features: ['NATIVE_SWAPS'] }] } }}>
          <div className="max-w-[500px]">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof NativeSwapsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
