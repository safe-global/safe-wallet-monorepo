import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../input'

/**
 * Input Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49172
 */
const meta = {
  title: 'UI/Input',
  component: Input,
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
    inputSize: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '250px' }}>
            <Input placeholder="Placeholder text" />
          </div>
          <div style={{ width: '250px' }}>
            <Input defaultValue="With value" />
          </div>
          <div style={{ width: '250px' }}>
            <Input defaultValue="Disabled" disabled />
          </div>
          <div style={{ width: '250px' }}>
            <Input defaultValue="Error state" aria-invalid />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Input Types</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '250px' }}>
            <Input type="text" placeholder="Text input" />
          </div>
          <div style={{ width: '250px' }}>
            <Input type="email" placeholder="Email input" />
          </div>
          <div style={{ width: '250px' }}>
            <Input type="password" placeholder="Password input" />
          </div>
          <div style={{ width: '250px' }}>
            <Input type="number" placeholder="Number input" />
          </div>
          <div style={{ width: '250px' }}>
            <Input type="search" placeholder="Search input" />
          </div>
          <div style={{ width: '250px' }}>
            <Input type="tel" placeholder="Phone input" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-lg font-semibold">Sizes</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Heights mirror <code>SelectTrigger</code> (<code>sm</code> h-8 / <code>default</code> h-9 / <code>lg</code>{' '}
          h-10) so a text input and a select on the same row line up. Prefer <code>inputSize</code> over a hand-rolled{' '}
          <code>className=&quot;h-…&quot;</code>. (Named <code>inputSize</code>, not <code>size</code>, to avoid the
          native numeric <code>size</code> attr.)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 250px)', gap: '1.5rem', alignItems: 'end' }}>
          <Input inputSize="sm" placeholder="sm (h-8)" />
          <Input inputSize="default" placeholder="default (h-9)" />
          <Input inputSize="lg" placeholder="lg (h-10)" />
        </div>
      </div>
    </div>
  ),
}
