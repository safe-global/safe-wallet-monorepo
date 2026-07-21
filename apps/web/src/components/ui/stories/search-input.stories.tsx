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
      options: ['default', 'hero'],
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
          Search boxes are a single height — <code>default</code> (h-9), mirroring <code>Input</code> /{' '}
          <code>SelectTrigger</code>. The standard app search box is the <code>SearchField</code> preset.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 220px)', gap: '1.5rem', alignItems: 'end' }}>
          <SearchInput inputSize="default" placeholder="default (h-9)" />
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-1 text-lg font-semibold">Skins</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          <code>surface</code> (default) sits on muted / list backgrounds; <code>default</code> reads on white / dialog
          surfaces.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 220px)', gap: '1.5rem', alignItems: 'end' }}>
          <SearchInput variant="surface" placeholder="surface (default)" />
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
