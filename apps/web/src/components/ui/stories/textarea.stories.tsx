import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from '../textarea'

/**
 * Textarea Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49180
 */
const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Textarea>

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
            <Textarea placeholder="Placeholder text" />
          </div>
          <div style={{ width: '300px' }}>
            <Textarea defaultValue="With value text that can span multiple lines" />
          </div>
          <div style={{ width: '300px' }}>
            <Textarea defaultValue="Disabled textarea" disabled />
          </div>
          <div style={{ width: '300px' }}>
            <Textarea defaultValue="Error state" aria-invalid />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Textarea placeholder="Default (3 rows)" rows={3} />
          </div>
          <div style={{ width: '300px' }}>
            <Textarea placeholder="Small (2 rows)" rows={2} />
          </div>
          <div style={{ width: '300px' }}>
            <Textarea placeholder="Large (5 rows)" rows={5} />
          </div>
        </div>
      </div>
    </div>
  ),
}
