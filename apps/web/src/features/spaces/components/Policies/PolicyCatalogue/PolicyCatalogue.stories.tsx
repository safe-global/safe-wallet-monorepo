import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { mockStarterPlan } from '../mocks/plan'
import PolicyCatalogue from './index'

/**
 * The empty-state policy catalogue: one card per policy that can be set up, plus the feedback card.
 *
 * Figma: https://www.figma.com/design/cOOeHQK12YR2SAKYKiNW5S/?node-id=15971-30121
 */
const meta = {
  title: 'Features/Spaces/PolicyCatalogue',
  component: PolicyCatalogue,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="bg-background p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PolicyCatalogue>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onSelect: fn() },
}

/** The plan does not include policies: the feedback card is gone and every tile leads to the upgrade. */
export const Locked: Story = {
  args: {
    onSelect: fn(),
    locked: { accountCounts: mockStarterPlan.accountCounts, onUpgrade: fn() },
  },
}
