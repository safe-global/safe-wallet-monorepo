import type { Meta, StoryObj } from '@storybook/react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import ExplorePossibleWidget from './index'

const meta = {
  component: ExplorePossibleWidget,
  parameters: {
    componentSubtitle: 'Components/Dashboard/ExplorePossibleWidget',
    nextjs: {
      appDirectory: true,
      navigation: {
        query: {
          safe: 'sep:0x0000000000000000000000000000000000000001',
        },
      },
    },
  },
  decorators: [
    (Story, { parameters }) => {
      const safeQuery = parameters?.nextjs?.navigation?.query?.safe || 'sep:0x0000000000000000000000000000000000000001'

      return (
        <StoreDecorator
          initialState={{
            chains: {
              data: [
                {
                  chainId: '1',
                  features: [FEATURES.NATIVE_SWAPS],
                },
              ],
            },
          }}
        >
          <RouterDecorator
            router={{
              query: {
                safe: safeQuery,
              },
            }}
          >
            <div className="max-w-full">
              <Story />
            </div>
          </RouterDecorator>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ExplorePossibleWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const LightMode: Story = {
  args: {},
  parameters: {
    theme: 'light',
  },
}

export const DarkMode: Story = {
  args: {},
  parameters: {
    theme: 'dark',
  },
}

export const NarrowViewport: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
