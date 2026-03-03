import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from '../separator'

/**
 * Separator Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49137
 */
const meta = {
  title: 'UI/Separator',
  component: Separator,
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Horizontal</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '400px' }}>
          <div>
            <p className="text-sm mb-2">Content above</p>
            <Separator />
            <p className="text-sm mt-2">Content below</p>
          </div>
          <div>
            <p className="text-sm mb-2">Between sections</p>
            <Separator />
            <p className="text-sm mt-2">More content</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Vertical</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '100px' }}>
          <span className="text-sm">Left</span>
          <Separator orientation="vertical" />
          <span className="text-sm">Middle</span>
          <Separator orientation="vertical" />
          <span className="text-sm">Right</span>
        </div>
      </div>
    </div>
  ),
}
