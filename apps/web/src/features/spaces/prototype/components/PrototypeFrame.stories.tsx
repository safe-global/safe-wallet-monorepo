import type { Meta, StoryObj } from '@storybook/react'
import { PrototypeFrame } from './PrototypeFrame'

const meta = {
  title: 'Features/Spaces/Pending queue prototype/Workspace frame',
  component: PrototypeFrame,
  parameters: { layout: 'fullscreen', nextjs: { router: { pathname: '/prototypes/pending-queue' } } },
  args: { children: <div className="p-6">Workspace content</div> },
} satisfies Meta<typeof PrototypeFrame>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
