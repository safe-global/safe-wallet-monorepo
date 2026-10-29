import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/decorators'
import ImportWorkspaceCsv from './ImportWorkspaceCsv'

const meta = {
  title: 'Features/Spaces/ImportWorkspaceCsv',
  component: ImportWorkspaceCsv,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [withMockProvider({ shadcn: true })],
} satisfies Meta<typeof ImportWorkspaceCsv>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { items: [] },
}
