import type { Meta, StoryObj } from '@storybook/react'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import { Label } from '../label'

/**
 * RadioGroup Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49182
 */
const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  argTypes: {
    defaultValue: {
      control: 'text',
    },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Basic Radio Group</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <RadioGroup defaultValue="option-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RadioGroupItem value="option-1" id="radio-1" />
              <Label htmlFor="radio-1">Option 1</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RadioGroupItem value="option-2" id="radio-2" />
              <Label htmlFor="radio-2">Option 2</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RadioGroupItem value="option-3" id="radio-3" />
              <Label htmlFor="radio-3">Option 3</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Disabled</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <RadioGroup defaultValue="option-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RadioGroupItem value="option-1" id="radio-disabled-1" />
              <Label htmlFor="radio-disabled-1">Option 1</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RadioGroupItem value="option-2" id="radio-disabled-2" disabled />
              <Label htmlFor="radio-disabled-2">Option 2 (Disabled)</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RadioGroupItem value="option-3" id="radio-disabled-3" />
              <Label htmlFor="radio-disabled-3">Option 3</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Horizontal Layout</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <RadioGroup defaultValue="option-1" style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RadioGroupItem value="option-1" id="radio-h-1" />
              <Label htmlFor="radio-h-1">Option 1</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RadioGroupItem value="option-2" id="radio-h-2" />
              <Label htmlFor="radio-h-2">Option 2</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RadioGroupItem value="option-3" id="radio-h-3" />
              <Label htmlFor="radio-h-3">Option 3</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  ),
}
