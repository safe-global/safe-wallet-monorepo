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
  },
} satisfies Meta<typeof Input>

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
    </div>
  ),
}
