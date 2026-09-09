import type { Meta, StoryObj } from '@storybook/react'
import SafeProBillingReminderModal from './index'

const meta = {
  component: SafeProBillingReminderModal,
  title: 'Features/SafePro/SafeProBillingReminderModal',
  tags: ['autodocs'],
  args: { open: true, onOpenChange: () => {}, onAddBillingDetails: () => {}, trialEndsAt: Date.UTC(2026, 11, 1) },
} satisfies Meta<typeof SafeProBillingReminderModal>

export default meta

export const Default: StoryObj<typeof meta> = {}
