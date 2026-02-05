import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from '../checkbox'
import { Label } from '../label'

/**
 * Checkbox Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49175
 */
const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  argTypes: {
    checked: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Checkbox>

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
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox />
            <span className="text-sm">Unchecked</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox checked />
            <span className="text-sm">Checked</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox disabled />
            <span className="text-sm">Disabled</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox checked disabled />
            <span className="text-sm">Checked Disabled</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Label</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox id="checkbox-1" />
            <Label htmlFor="checkbox-1">Accept terms</Label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox id="checkbox-2" checked />
            <Label htmlFor="checkbox-2">Subscribe to newsletter</Label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox id="checkbox-3" disabled />
            <Label htmlFor="checkbox-3">Disabled option</Label>
          </div>
        </div>
      </div>
    </div>
  ),
}
