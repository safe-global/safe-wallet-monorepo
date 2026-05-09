import type { Meta, StoryObj } from '@storybook/react'
import { SquareDashed, Plus, ArrowRight } from 'lucide-react'
import { Button } from '../button'

/**
 * Button Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44442
 */
const meta = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'xs', 'lg', 'icon', 'icon-sm', 'icon-xs', 'icon-lg'],
    },
    disabled: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Icon Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="icon-xs" variant="outline">
            <Plus className="size-3" />
          </Button>
          <Button size="icon-sm" variant="outline">
            <Plus className="size-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Plus className="size-4" />
          </Button>
          <Button size="icon-lg" variant="outline">
            <Plus className="size-5" />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Icons</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button>
            <Plus className="size-4" />
            Add Item
          </Button>
          <Button variant="secondary">
            Next
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline">
            <SquareDashed className="size-4" />
            Label
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">All Variants × Sizes</h3>
        <div className="flex flex-col gap-4">
          {(['default', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((variant) => (
            <div key={variant} className="flex items-center gap-4">
              <span className="w-24 text-sm text-muted-foreground">{variant}</span>
              <Button variant={variant} size="xs">
                XS
              </Button>
              <Button variant={variant} size="sm">
                SM
              </Button>
              <Button variant={variant} size="default">
                Default
              </Button>
              <Button variant={variant} size="lg">
                LG
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}
