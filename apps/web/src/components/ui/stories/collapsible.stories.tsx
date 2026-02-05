import type { Meta, StoryObj } from '@storybook/react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../collapsible'
import { Button } from '../button'
import { ChevronDown } from 'lucide-react'

/**
 * Collapsible Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  argTypes: {
    defaultOpen: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Collapsible>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-sm font-medium">Collapsible Content</span>
                <CollapsibleTrigger
                  render={
                    <Button variant="ghost" size="sm">
                      <ChevronDown />
                    </Button>
                  }
                />
              </div>
              <CollapsibleContent>
                <div style={{ padding: '1rem 0' }}>
                  <p className="text-sm">This is collapsible content that can be shown or hidden.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div style={{ width: '300px' }}>
            <Collapsible defaultOpen>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-sm font-medium">Open by Default</span>
                <CollapsibleTrigger
                  render={
                    <Button variant="ghost" size="sm">
                      <ChevronDown />
                    </Button>
                  }
                />
              </div>
              <CollapsibleContent>
                <div style={{ padding: '1rem 0' }}>
                  <p className="text-sm">This content is open by default.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Button</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Collapsible>
              <CollapsibleTrigger
                render={
                  <Button variant="outline">
                    Toggle
                    <ChevronDown />
                  </Button>
                }
              />
              <CollapsibleContent>
                <div
                  style={{
                    padding: '1rem',
                    marginTop: '0.5rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                  }}
                >
                  <p className="text-sm">Collapsible content triggered by button.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  ),
}
