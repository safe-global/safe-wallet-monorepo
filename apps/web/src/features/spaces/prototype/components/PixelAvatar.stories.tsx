import type { Meta, StoryObj } from '@storybook/react'
import { PixelAvatar } from './PixelAvatar'

const meta = {
  title: 'Features/Spaces/Pending queue prototype/Pixel avatar',
  component: PixelAvatar,
  args: { persona: 'owner', size: 96 },
} satisfies Meta<typeof PixelAvatar>
export default meta
type Story = StoryObj<typeof meta>
export const Dev: Story = {}
export const Sam: Story = { args: { persona: 'single' } }
export const Alex: Story = { args: { persona: 'member' } }
export const Noor: Story = { args: { persona: 'admin' } }
