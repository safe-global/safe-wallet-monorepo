import type { Meta, StoryObj } from '@storybook/react'
import { Toggle } from '../toggle'
import { Bold, Italic, Underline } from 'lucide-react'

/**
 * Toggle Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44447
 */
const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
          <Toggle variant="default">Default</Toggle>
          <Toggle variant="default" aria-pressed>
            Pressed
          </Toggle>
          <Toggle variant="outline">Outline</Toggle>
          <Toggle variant="outline" aria-pressed>
            Pressed
          </Toggle>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
            alignItems: 'center',
          }}
        >
          <Toggle size="sm">Small</Toggle>
          <Toggle size="default">Default</Toggle>
          <Toggle size="lg">Large</Toggle>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Icons</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
          <Toggle variant="outline">
            <Bold />
          </Toggle>
          <Toggle variant="outline" aria-pressed>
            <Italic />
          </Toggle>
          <Toggle variant="outline">
            <Underline />
          </Toggle>
        </div>
      </div>
    </div>
  ),
}
