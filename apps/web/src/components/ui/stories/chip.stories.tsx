import type { Meta, StoryObj } from '@storybook/react'
import { Chip } from '../chip'

const meta = {
  title: 'UI/Chip',
  component: Chip,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'primary', 'warning', 'success', 'destructive', 'info', 'positive', 'negative'],
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
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Default' },
}

export const Removable: Story = {
  args: { children: 'Removable', onDelete: () => {} },
}

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <Chip variant="default">Default</Chip>
          <Chip variant="outline">Outline</Chip>
          <Chip variant="primary">Primary</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="success">Success</Chip>
          <Chip variant="destructive">Destructive</Chip>
          <Chip variant="info">Info</Chip>
          <Chip variant="positive">+4.31%</Chip>
          <Chip variant="negative">-2.10%</Chip>
          <Chip variant="outline" onDelete={() => {}}>
            Removable
          </Chip>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Geometry lives on <code>size</code>/<code>shape</code> (<code>default</code> is content-height), never on a
          call-site <code>className</code>.
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Chip size="sm">sm</Chip>
          <Chip size="default">default</Chip>
          <Chip size="lg">lg</Chip>
          <Chip size="auto">auto</Chip>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Shapes</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Chip shape="pill">pill</Chip>
          <Chip shape="tag">tag</Chip>
        </div>
      </div>
    </div>
  ),
}
