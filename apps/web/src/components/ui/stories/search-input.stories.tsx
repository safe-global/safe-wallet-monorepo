import type { Meta, StoryObj } from '@storybook/react'
import { SearchInput } from '../search-input'

/**
 * SearchInput Component Stories
 *
 * A search field: an InputGroup with a leading search icon. Defaults to the `surface` skin at the
 * `default` (h-9) height. The standard app search box is the `SearchField` preset, which wraps this.
 */
const meta = {
  title: 'UI/SearchInput',
  component: SearchInput,
  argTypes: {
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    inputSize: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'hero'],
    },
    variant: {
      control: 'select',
      options: ['default', 'surface'],
    },
  },
  args: {
    placeholder: 'Search',
  },
} satisfies Meta<typeof SearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="w-72">
      <SearchInput {...args} />
    </div>
  ),
}

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-1 text-lg font-semibold">Sizes</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Same tiers as <code>Input</code> / <code>SelectTrigger</code> — <code>sm</code> (h-8), <code>default</code>{' '}
          (h-9), <code>lg</code> (h-10). Match the height of the buttons the search box shares a row with: a filter bar
          with <code>size=&quot;lg&quot;</code> buttons (e.g. the address book header) wants{' '}
          <code>inputSize=&quot;lg&quot;</code>. The standard app search box is the <code>SearchField</code> preset.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 220px)', gap: '1.5rem', alignItems: 'end' }}>
          <SearchInput inputSize="sm" placeholder="sm (h-8)" />
          <SearchInput inputSize="default" placeholder="default (h-9)" />
          <SearchInput inputSize="lg" placeholder="lg (h-10)" />
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-1 text-lg font-semibold">Skins</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          <code>search</code> (default) is filled and borderless: <code>bg-input</code> with a transparent 1px border,{' '}
          <code>shadow-xs</code>, and a hover ring. <code>surface</code> and <code>default</code> keep a visible{' '}
          <code>border-border</code> for non-search fields.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 220px)', gap: '1.5rem', alignItems: 'end' }}>
          <SearchInput placeholder="search (default)" />
          <SearchInput variant="surface" placeholder="surface" />
          <SearchInput variant="default" placeholder="default" />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 220px)', gap: '1.5rem', alignItems: 'end' }}>
          <SearchInput placeholder="Empty" />
          <SearchInput defaultValue="0x1234…abcd" />
          <SearchInput placeholder="Disabled" disabled />
        </div>
      </div>
    </div>
  ),
}
