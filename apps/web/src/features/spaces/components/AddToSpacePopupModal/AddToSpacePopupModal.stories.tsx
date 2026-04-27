import type { Meta, StoryObj } from '@storybook/react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
  args: {},
} satisfies Meta<typeof AddToSpacePopupModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (Story) => (
      <Dialog open>
        <DialogContent className="w-[423px] max-w-none p-0">
          <Story />
        </DialogContent>
      </Dialog>
    ),
  ],
}
