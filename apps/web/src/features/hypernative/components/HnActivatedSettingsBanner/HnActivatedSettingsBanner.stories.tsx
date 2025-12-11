import type { Meta, StoryObj } from '@storybook/react'
import { HnActivatedSettingsBanner } from './HnActivatedSettingsBanner'

const meta = {
  component: HnActivatedSettingsBanner,
  title: 'Features/Hypernative/HnActivatedSettingsBanner',
  tags: ['autodocs'],
} satisfies Meta<typeof HnActivatedSettingsBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
