import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../input'
import { Button } from '../button'

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
      options: ['sm', 'default', 'lg', 'hero'],
    },
    variant: {
      control: 'select',
      options: ['default', 'surface'],
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
          The tiers mirror <code>Button</code>&apos;s so a field and a button on one row line up: <code>sm</code> (h-8)
          pairs with <code>size=&quot;sm&quot;</code>, <code>default</code> (h-9) with{' '}
          <code>size=&quot;default&quot;</code> and <code>SelectTrigger</code>&apos;s default, and <code>lg</code>{' '}
          (h-10) with <code>size=&quot;lg&quot;</code>/<code>&quot;action&quot;</code>/<code>&quot;submit&quot;</code>.{' '}
          <code>hero</code> (66px) is the Safe creation / big-filter field tier. Prefer <code>inputSize</code> over a
          hand-rolled <code>className=&quot;h-…&quot;</code>. (Named <code>inputSize</code>, not <code>size</code>, to
          avoid the native numeric <code>size</code> attr.)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 200px)', gap: '1.5rem', alignItems: 'end' }}>
          <Input inputSize="sm" placeholder="sm (h-8)" />
          <Input inputSize="default" placeholder="default (h-9)" />
          <Input inputSize="lg" placeholder="lg (h-10)" />
          <Input inputSize="hero" variant="surface" placeholder="hero surface (h-66)" />
        </div>
        <p className="mt-4 mb-2 text-sm text-muted-foreground">
          Paired with a button of the matching size. (<code>Input</code> renders a <code>w-full</code> wrapper for its
          error slot, so constrain its width on a parent, not via <code>className</code>.)
        </p>
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <div className="w-52">
              <Input inputSize="sm" placeholder="sm" />
            </div>
            <Button size="sm">Small</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-52">
              <Input placeholder="default" />
            </div>
            <Button>Default</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-52">
              <Input inputSize="lg" placeholder="lg" />
            </div>
            <Button size="lg">Large</Button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 className="mb-1 text-lg font-semibold">Skins</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          <code>default</code> is the filled field: <code>bg-input</code> — white in light mode, a translucent lift in
          dark that works over any parent surface. <code>surface</code> is the opaque <code>bg-card</code> fill; reach
          for it only when translucency would show through (over images, gradients or coloured strips).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 250px)', gap: '1.5rem', alignItems: 'end' }}>
          <Input placeholder="default" />
          <Input variant="surface" placeholder="surface" />
        </div>
      </div>
    </div>
  ),
}
