import type { Meta, StoryObj } from '@storybook/react'
import SafeProLockedWorkspace from './index'

const meta = {
  component: SafeProLockedWorkspace,
  title: 'Features/SafePro/SafeProLockedWorkspace',
  tags: ['autodocs'],
  args: { onStartTrial: () => {} },
} satisfies Meta<typeof SafeProLockedWorkspace>

export default meta

export const Default: StoryObj<typeof meta> = {}
