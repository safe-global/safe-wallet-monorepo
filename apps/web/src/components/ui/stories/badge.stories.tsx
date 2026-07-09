import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../badge'

/**
 * Badge Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44441
 */
const meta = {
  title: 'UI/Badge',
  component: Badge,
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'destructive',
        'outline',
        'warning',
        'success',
        'info',
        'positive',
        'negative',
        'ghost',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'auto'],
    },
    shape: {
      control: 'select',
      options: ['pill', 'tag'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
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
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="positive">+4.31%</Badge>
          <Badge variant="negative">-2.10%</Badge>
          <Badge variant="ghost">Ghost</Badge>
          <Badge variant="link">Link</Badge>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Geometry lives on <code>size</code>/<code>shape</code>, never on a call-site <code>className</code>.
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Badge size="sm">sm</Badge>
          <Badge size="default">default</Badge>
          <Badge size="lg">lg</Badge>
          <Badge size="auto">auto (multi&#8209;line content)</Badge>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Shapes</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Badge shape="pill">pill</Badge>
          <Badge shape="tag">tag</Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Text</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
          <Badge variant="default">New</Badge>
          <Badge variant="secondary">Updated</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="outline">Draft</Badge>
          <Badge variant="warning">Expiring</Badge>
          <Badge variant="success">Active</Badge>
          <Badge variant="ghost">Pending</Badge>
          <Badge variant="link">View</Badge>
        </div>
      </div>
    </div>
  ),
}
