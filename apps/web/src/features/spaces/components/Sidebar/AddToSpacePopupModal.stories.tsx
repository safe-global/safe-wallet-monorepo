import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import { AddToSpacePopupModal } from './AddToSpacePopupModal'

const meta = {
  title: 'Features/Spaces/AddToSpacePopupModal',
  component: AddToSpacePopupModal,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: false,
    },
  },
  args: {
    onClose: () => undefined,
  },
} satisfies Meta<typeof AddToSpacePopupModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="w-[423px]">
        <Story />
      </div>
    ),
  ],
}
