import type { Meta, StoryObj } from '@storybook/react'
import { SpacesBanner } from './SpacesBanner'

const meta = {
  title: 'Components/Dashboard/Banners/SpacesBanner',
  component: SpacesBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    visualTest: { disable: true },
  },
} satisfies Meta<typeof SpacesBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onDismiss: () => {},
  },
}
