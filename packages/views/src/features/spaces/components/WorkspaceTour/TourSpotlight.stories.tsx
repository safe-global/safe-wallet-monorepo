import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@safe-global/views/components/ui/button'
import TourPlaceholderRow, { TOUR_PLACEHOLDER_ROW_HEIGHT } from './TourPlaceholderRow'
import TourSpotlight from './TourSpotlight'

const navItem = { top: 120, left: 24, width: 200, height: 36, radius: 8 }
const placeholderRow = { top: 120, left: 280, width: 640, height: TOUR_PLACEHOLDER_ROW_HEIGHT, radius: 12 }

const meta = {
  title: 'Features/Spaces/WorkspaceTour/TourSpotlight',
  component: TourSpotlight,
  parameters: { layout: 'fullscreen' },
  tags: ['skip-visual-test'],
  args: { holes: [navItem] },
  render: (args) => (
    <div className="h-[400px] p-6">
      <Button variant="outline">Page content behind the scrim</Button>
      <TourSpotlight {...args} />
    </div>
  ),
} satisfies Meta<typeof TourSpotlight>

export default meta
type Story = StoryObj<typeof meta>

export const SingleHole: Story = {}

export const NavItemAndPlaceholderRow: Story = {
  args: { holes: [placeholderRow, navItem] },
  render: (args) => (
    <div className="h-[400px] p-6">
      <TourSpotlight {...args} />
      <TourPlaceholderRow rect={placeholderRow} />
    </div>
  ),
}
