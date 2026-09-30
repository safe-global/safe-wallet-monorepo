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
    bleed: {
      control: 'select',
      options: ['none', '3', '4', '6'],
    },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
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

/** Each `bleed` value cancels the matching container padding so the rule spans edge to edge. */
export const Bleed: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '400px' }}>
      {(['none', '3', '4', '6'] as const).map((bleed) => (
        <div key={bleed} className="border-border bg-card rounded-md border px-6 py-4">
          <p className="text-sm mb-2">bleed=&quot;{bleed}&quot; in a px-6 container</p>
          <Separator bleed={bleed} />
          <p className="text-sm mt-2">Only bleed=&quot;6&quot; reaches both edges here.</p>
        </div>
      ))}
    </div>
  ),
}
