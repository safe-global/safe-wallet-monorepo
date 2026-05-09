import type { Meta, StoryObj } from '@storybook/react'
import { NativeSelect, NativeSelectOption, NativeSelectOptGroup } from '../native-select'

/**
 * NativeSelect Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/NativeSelect',
  component: NativeSelect,
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
} satisfies Meta<typeof NativeSelect>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '200px' }}>
            <NativeSelect size="sm">
              <NativeSelectOption value="">Small</NativeSelectOption>
              <NativeSelectOption value="option-1">Option 1</NativeSelectOption>
              <NativeSelectOption value="option-2">Option 2</NativeSelectOption>
            </NativeSelect>
          </div>
          <div style={{ width: '200px' }}>
            <NativeSelect size="default">
              <NativeSelectOption value="">Default</NativeSelectOption>
              <NativeSelectOption value="option-1">Option 1</NativeSelectOption>
              <NativeSelectOption value="option-2">Option 2</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '200px' }}>
            <NativeSelect defaultValue="option-1">
              <NativeSelectOption value="option-1">Option 1</NativeSelectOption>
              <NativeSelectOption value="option-2">Option 2</NativeSelectOption>
              <NativeSelectOption value="option-3">Option 3</NativeSelectOption>
            </NativeSelect>
          </div>
          <div style={{ width: '200px' }}>
            <NativeSelect disabled>
              <NativeSelectOption value="">Disabled</NativeSelectOption>
              <NativeSelectOption value="option-1">Option 1</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Groups</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '250px' }}>
            <NativeSelect defaultValue="apple">
              <NativeSelectOptGroup label="Fruits">
                <NativeSelectOption value="apple">Apple</NativeSelectOption>
                <NativeSelectOption value="banana">Banana</NativeSelectOption>
              </NativeSelectOptGroup>
              <NativeSelectOptGroup label="Vegetables">
                <NativeSelectOption value="carrot">Carrot</NativeSelectOption>
                <NativeSelectOption value="broccoli">Broccoli</NativeSelectOption>
              </NativeSelectOptGroup>
            </NativeSelect>
          </div>
        </div>
      </div>
    </div>
  ),
}
