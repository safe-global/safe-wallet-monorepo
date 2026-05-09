import type { Meta, StoryObj } from '@storybook/react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from '../input-group'
import { Search, Mail, Send } from 'lucide-react'

/**
 * InputGroup Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/InputGroup',
  component: InputGroup,
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Addon (Start)</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Search />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search..." />
            </InputGroup>
          </div>
          <div style={{ width: '300px' }}>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>@</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="Username" />
            </InputGroup>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Addon (End)</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <InputGroup>
              <InputGroupInput placeholder="Email" />
              <InputGroupAddon align="inline-end">
                <Mail />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Button</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <InputGroup>
              <InputGroupInput placeholder="Enter message" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton>
                  <Send />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Textarea</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <InputGroup>
              <InputGroupTextarea placeholder="Enter message..." rows={3} />
              <InputGroupAddon align="block-end">
                <InputGroupButton>
                  <Send />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>
    </div>
  ),
}
