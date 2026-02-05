/**
 * Story Template: UI Component (shadcn primitives)
 *
 * Use this template for stateless UI components in /components/ui/
 * These components have no data dependencies and rely purely on props.
 *
 * Replace all {{PLACEHOLDER}} values with actual values.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { {{ComponentName}} } from './{{component-name}}'

const meta = {
  title: 'UI/{{ComponentName}}',
  component: {{ComponentName}},
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '{{Brief description of the component purpose}}',
      },
    },
  },
  argTypes: {
    // Define controls for each significant prop
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size of the component',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the component',
    },
    // Add more argTypes as needed
  },
} satisfies Meta<typeof {{ComponentName}}>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default state with standard props
 */
export const Default: Story = {
  args: {
    children: '{{ComponentName}}',
  },
}

/**
 * Comprehensive overview of all variants and states
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {/* Variants Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div className="flex flex-wrap items-center gap-4">
          <{{ComponentName}} variant="default">Default</{{ComponentName}}>
          <{{ComponentName}} variant="secondary">Secondary</{{ComponentName}}>
          <{{ComponentName}} variant="outline">Outline</{{ComponentName}}>
          <{{ComponentName}} variant="ghost">Ghost</{{ComponentName}}>
          <{{ComponentName}} variant="destructive">Destructive</{{ComponentName}}>
        </div>
      </div>

      {/* Sizes Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <{{ComponentName}} size="sm">Small</{{ComponentName}}>
          <{{ComponentName}} size="default">Default</{{ComponentName}}>
          <{{ComponentName}} size="lg">Large</{{ComponentName}}>
        </div>
      </div>

      {/* States Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div className="flex flex-wrap items-center gap-4">
          <{{ComponentName}}>Enabled</{{ComponentName}}>
          <{{ComponentName}} disabled>Disabled</{{ComponentName}}>
        </div>
      </div>
    </div>
  ),
}

/**
 * Secondary variant
 */
export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

/**
 * Outline variant
 */
export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

/**
 * Small size
 */
export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
}

/**
 * Large size
 */
export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
}

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
}
