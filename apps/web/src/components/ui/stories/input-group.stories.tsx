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
import { SearchInput } from '../search-input'

/**
 * InputGroup Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/InputGroup',
  component: InputGroup,
  argTypes: {
    inputSize: {
      control: 'select',
      options: ['default', 'hero'],
    },
    variant: {
      control: 'select',
      options: ['default', 'surface'],
    },
  },
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Group Sizes</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
            alignItems: 'end',
          }}
        >
          <div style={{ width: '300px' }}>
            <InputGroup>
              <InputGroupInput placeholder="default (h-9)" />
            </InputGroup>
          </div>
          <div style={{ width: '300px' }}>
            <InputGroup inputSize="hero" variant="surface">
              <InputGroupInput placeholder="hero surface (h-66)" />
            </InputGroup>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Surface Search Preset</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <SearchInput placeholder="Search..." />
          </div>
        </div>
      </div>

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

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Addon (Block Start)</h3>
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
              <InputGroupAddon align="block-start">
                <InputGroupText>Amount</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="0.00" />
            </InputGroup>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Button Sizes</h3>
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
              <InputGroupInput placeholder="Extra small button" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="xs">Send</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div style={{ width: '300px' }}>
            <InputGroup>
              <InputGroupInput placeholder="Small button" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="sm">Send</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div style={{ width: '300px' }}>
            <InputGroup>
              <InputGroupInput placeholder="Icon xs button" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs">
                  <Send />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div style={{ width: '300px' }}>
            <InputGroup>
              <InputGroupInput placeholder="Icon sm button" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-sm">
                  <Send />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Invalid</h3>
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
                <Mail />
              </InputGroupAddon>
              <InputGroupInput placeholder="Email" aria-invalid defaultValue="not-an-email" />
            </InputGroup>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Disabled</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '300px' }}>
            <InputGroup data-disabled="true">
              <InputGroupAddon align="inline-start">
                <Search />
              </InputGroupAddon>
              <InputGroupInput placeholder="Disabled" disabled />
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
