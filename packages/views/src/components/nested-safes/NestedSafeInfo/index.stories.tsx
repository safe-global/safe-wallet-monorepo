import type { Meta, StoryObj } from '@storybook/react'
import { NestedSafeInfo } from './index'

const meta = {
  title: 'Components/NestedSafes/NestedSafeInfo',
  component: NestedSafeInfo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NestedSafeInfo>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The empty-state informational panel shown when a Safe has no Nested Safes yet.
 * It explains what Nested Safes are and what they enable.
 */
export const Default: Story = {}
