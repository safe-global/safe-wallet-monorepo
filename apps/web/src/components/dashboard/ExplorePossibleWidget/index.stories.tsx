import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import ExplorePossibleWidget from './index'
import { Box } from '@mui/material'

const meta = {
  component: ExplorePossibleWidget,
  parameters: {
    componentSubtitle: 'Renders a horizontal scrollable carousel showcasing key Safe features',
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
            chains: { data: [{ chainId: '1' }] },
          }}
        >
          <RouterDecorator
            router={{
              query: {
                safe: safeQuery,
              },
            }}
          >
            <Box sx={{ maxWidth: '100%' }}>
              <Story />
            </Box>
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
