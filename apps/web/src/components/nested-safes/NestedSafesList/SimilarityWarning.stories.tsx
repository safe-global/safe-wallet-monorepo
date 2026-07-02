import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SimilarityWarning } from './SimilarityWarning'

/**
 * Warning chip shown next to addresses flagged as visually similar to another
 * address in a nested Safes list (potential address-poisoning attack). Hovering
 * or focusing the icon reveals the explanatory tooltip.
 */
const meta = {
  title: 'Components/NestedSafes/SimilarityWarning',
  component: SimilarityWarning,
} satisfies Meta<typeof SimilarityWarning>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default resting state — the warning icon on its own. Hover or focus it to
 * reveal the tooltip.
 */
export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <SimilarityWarning />
    </div>
  ),
}

/**
 * The tooltip forced open so its copy can be validated without hovering.
 * Mirrors the trigger and content the component renders internally.
 */
export const TooltipOpen: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '3rem' }}>
      <Tooltip open>
        <TooltipTrigger
          render={
            <span className="ml-2 inline-flex shrink-0">
              <SimilarityWarning />
            </span>
          }
        />
        <TooltipContent>This address looks similar to another address. Double-check before selecting.</TooltipContent>
      </Tooltip>
    </div>
  ),
}

/**
 * In-context example: the warning appended to an address label, matching how it
 * appears within a row of the nested Safes list.
 */
export const InContext: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span className="font-mono text-sm">0xC0ffee...C0de</span>
      <SimilarityWarning />
    </div>
  ),
}
