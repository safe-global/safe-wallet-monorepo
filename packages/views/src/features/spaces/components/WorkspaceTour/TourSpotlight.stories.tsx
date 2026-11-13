import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@safe-global/views/components/ui/button'
import TourPlaceholderRow, { TOUR_PLACEHOLDER_ROW_HEIGHT } from './TourPlaceholderRow'
import TourSpotlight from './TourSpotlight'

const SIDEBAR_RIGHT = 240
const navItem = { top: 120, left: 24, width: 200, height: 36, radius: 8 }
const button = { top: 24, left: 280, width: 260, height: 36, radius: 8 }
const placeholderRow = { top: 120, left: 280, width: 640, height: TOUR_PLACEHOLDER_ROW_HEIGHT, radius: 12 }

const meta = {
  title: 'Features/Spaces/WorkspaceTour/TourSpotlight',
  component: TourSpotlight,
  parameters: { layout: 'fullscreen' },
  tags: ['skip-visual-test'],
  args: { hole: button, uncoveredLeft: 0, highlights: [button] },
  render: (args) => (
    <div className="h-[400px] pl-[280px] pt-6">
      <Button variant="outline">Highlighted and readable</Button>
      <TourSpotlight {...args} />
    </div>
  ),
} satisfies Meta<typeof TourSpotlight>

export default meta
type Story = StoryObj<typeof meta>

export const ContentElement: Story = {}

export const SidebarItemOnly: Story = {
  args: { hole: null, uncoveredLeft: SIDEBAR_RIGHT, highlights: [navItem] },
}

export const SidebarItemAndPlaceholderRow: Story = {
  args: { hole: placeholderRow, uncoveredLeft: SIDEBAR_RIGHT, highlights: [placeholderRow, navItem] },
  render: (args) => (
    <div className="h-[400px] p-6">
      <TourSpotlight {...args} />
      <TourPlaceholderRow rect={placeholderRow} />
    </div>
  ),
}
