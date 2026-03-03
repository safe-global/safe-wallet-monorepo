import type { Meta, StoryObj } from '@storybook/react'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from '../combobox'

/**
 * Combobox Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
]

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Basic Combobox</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Combobox>
              <ComboboxInput placeholder="Select framework..." showTrigger />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>No results found.</ComboboxEmpty>
                  {frameworks.map((framework) => (
                    <ComboboxItem key={framework.value} value={framework.value}>
                      {framework.label}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Groups</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <Combobox>
              <ComboboxInput placeholder="Select..." showTrigger />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxGroup>
                    <ComboboxLabel>Frontend</ComboboxLabel>
                    <ComboboxItem value="react">React</ComboboxItem>
                    <ComboboxItem value="vue">Vue</ComboboxItem>
                  </ComboboxGroup>
                  <ComboboxGroup>
                    <ComboboxLabel>Backend</ComboboxLabel>
                    <ComboboxItem value="node">Node.js</ComboboxItem>
                    <ComboboxItem value="python">Python</ComboboxItem>
                  </ComboboxGroup>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>
    </div>
  ),
}
