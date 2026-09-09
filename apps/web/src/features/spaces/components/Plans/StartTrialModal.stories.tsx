import type { Meta, StoryObj } from '@storybook/react'
import StartTrialModal from './StartTrialModal'

const meta = {
  component: StartTrialModal,
  title: 'Features/Spaces/StartTrialModal',
  tags: ['autodocs'],
  args: { open: true, trialDays: 60, onOpenChange: () => {}, onContinue: () => {} },
} satisfies Meta<typeof StartTrialModal>

export default meta
type Story = StoryObj<typeof meta>

export const SixtyDays: Story = {}

export const ThirtyDays: Story = { args: { trialDays: 30 } }
