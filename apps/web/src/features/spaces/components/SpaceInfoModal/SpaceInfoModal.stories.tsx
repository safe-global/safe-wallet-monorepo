import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import SpaceInfoModal from './index'

const meta = {
  title: 'Features/Spaces/SpaceInfoModal',
  component: SpaceInfoModal,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: false,
    },
  },
  args: {
    onClose: () => {},
  },
} satisfies Meta<typeof SpaceInfoModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
