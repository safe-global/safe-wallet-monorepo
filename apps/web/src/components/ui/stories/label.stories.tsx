import type { Meta, StoryObj } from '@storybook/react'
import { Label } from '../label'

/**
 * Label Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49170
 */
const meta = {
  title: 'UI/Label',
  component: Label,
  argTypes: {
    htmlFor: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Basic Labels</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <Label>Default label</Label>
          <Label htmlFor="input-1">Label with htmlFor</Label>
          <Label>Long label text that wraps to multiple lines</Label>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Form Elements</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="email">Email address</Label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="password">Password</Label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  ),
}
