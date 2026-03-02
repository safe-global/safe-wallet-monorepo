import type { Meta, StoryObj } from '@storybook/react'
import { Slider } from '../slider'

/**
 * Slider Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49188
 */
const meta = {
  title: 'UI/Slider',
  component: Slider,
  argTypes: {
    defaultValue: {
      control: { type: 'range', min: 0, max: 100 },
    },
  },
} satisfies Meta<typeof Slider>

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
            <label className="text-sm mb-2 block">Default (0)</label>
            <Slider defaultValue={0} />
          </div>
          <div style={{ width: '300px' }}>
            <label className="text-sm mb-2 block">Value (50)</label>
            <Slider defaultValue={50} />
          </div>
          <div style={{ width: '300px' }}>
            <label className="text-sm mb-2 block">Max (100)</label>
            <Slider defaultValue={100} />
          </div>
          <div style={{ width: '300px' }}>
            <label className="text-sm mb-2 block">Disabled</label>
            <Slider defaultValue={50} disabled />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Range</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <label className="text-sm mb-2 block">Custom range (0-200)</label>
            <Slider defaultValue={100} min={0} max={200} />
          </div>
          <div style={{ width: '300px' }}>
            <label className="text-sm mb-2 block">Small range (0-10)</label>
            <Slider defaultValue={5} min={0} max={10} />
          </div>
        </div>
      </div>
    </div>
  ),
}
