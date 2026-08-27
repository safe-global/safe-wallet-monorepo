import type { Meta, StoryObj } from '@storybook/react'
import PolicyCatalogue from './index'

/**
 * The empty-state policy catalogue. Mechanisms that have not shipped render as unavailable
 * rather than being hidden, so the page shows the full range of policies from day one.
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

export const Default: Story = {}
