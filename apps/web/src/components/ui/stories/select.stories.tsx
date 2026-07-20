import type { Meta, StoryObj } from '@storybook/react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../select'

/**
 * Select Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49185
 */
const meta = {
  title: 'UI/Select',
  component: Select,
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

// Base UI's SelectValue renders the raw value unless the Root receives an `items`
// value→label map (labels live in the popup, which is unmounted while closed).
const OPTION_ITEMS = { 'option-1': 'Option 1', 'option-2': 'Option 2', 'option-3': 'Option 3' }
const FRUIT_ITEMS = { apple: 'Apple', banana: 'Banana', orange: 'Orange', carrot: 'Carrot', broccoli: 'Broccoli' }
const OPTION_ITEMS_DISABLED = { 'option-1': 'Option 1', 'option-2': 'Option 2', 'option-3': 'Disabled option' }

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
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
          <Select defaultValue="option-1" items={OPTION_ITEMS}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Small" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
              <SelectItem value="option-3">Option 3</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="option-1" items={OPTION_ITEMS}>
            <SelectTrigger size="default">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
              <SelectItem value="option-3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          <b>default</b> — bordered field on the page background. <b>surface</b> — bg-card + rounded-lg filter/toolbar
          select. <b>ghost</b> — border/shadow/bg reset for inline/embedded triggers.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <Select defaultValue="option-1" items={OPTION_ITEMS}>
            <SelectTrigger variant="default" className="w-48">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="option-1" items={OPTION_ITEMS}>
            <SelectTrigger variant="surface" className="w-48">
              <SelectValue placeholder="Surface" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="option-1" items={OPTION_ITEMS}>
            <SelectTrigger variant="ghost" className="w-48">
              <SelectValue placeholder="Ghost" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
            </SelectContent>
          </Select>
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
          <Select defaultValue="option-1" items={OPTION_ITEMS}>
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
            </SelectContent>
          </Select>
          <Select items={OPTION_ITEMS}>
            <SelectTrigger>
              <SelectValue placeholder="Placeholder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
            </SelectContent>
          </Select>
          <Select disabled items={OPTION_ITEMS}>
            <SelectTrigger>
              <SelectValue placeholder="Disabled" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="option-1" items={OPTION_ITEMS}>
            <SelectTrigger aria-invalid>
              <SelectValue placeholder="Error state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
            </SelectContent>
          </Select>
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
          <Select defaultValue="apple" items={FRUIT_ITEMS}>
            <SelectTrigger>
              <SelectValue placeholder="Select fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Vegetables</SelectLabel>
                <SelectItem value="carrot">Carrot</SelectItem>
                <SelectItem value="broccoli">Broccoli</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Separator &amp; Disabled Item</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <Select defaultValue="option-1" items={OPTION_ITEMS_DISABLED}>
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
              <SelectSeparator />
              <SelectItem value="option-3" disabled>
                Disabled option
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  ),
}
