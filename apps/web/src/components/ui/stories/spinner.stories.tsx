import type { Meta, StoryObj } from '@storybook/react'
import { Spinner } from '../spinner'

/**
 * Spinner Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  argTypes: {
    className: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Spinner style={{ width: '16px', height: '16px' }} />
            <span className="text-xs text-muted-foreground">Small (16px)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Spinner style={{ width: '24px', height: '24px' }} />
            <span className="text-xs text-muted-foreground">Default (24px)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Spinner style={{ width: '32px', height: '32px' }} />
            <span className="text-xs text-muted-foreground">Large (32px)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Spinner style={{ width: '48px', height: '48px' }} />
            <span className="text-xs text-muted-foreground">Extra Large (48px)</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">In Context</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Spinner />
            <span className="text-sm">Loading...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Spinner style={{ width: '20px', height: '20px' }} />
            <span className="text-sm">Processing</span>
          </div>
        </div>
      </div>
    </div>
  ),
}
