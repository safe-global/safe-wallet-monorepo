import type { Meta, StoryObj } from '@storybook/react'
import SafeProTrialActivatedModal from './index'

const meta = {
  component: SafeProTrialActivatedModal,
  title: 'Features/SafePro/SafeProTrialActivatedModal',
  tags: ['autodocs'],
  args: { open: true, onOpenChange: () => {}, trialEndsAt: Date.UTC(2026, 11, 6) },
} satisfies Meta<typeof SafeProTrialActivatedModal>

export default meta

export const Default: StoryObj<typeof meta> = {}

export const NewWorkspace: StoryObj<typeof meta> = { args: { ctaHref: '/welcome/create-space' } }
