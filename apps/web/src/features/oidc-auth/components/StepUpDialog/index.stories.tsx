import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import type { StepUpStatus } from '../../store/stepUpSlice'
import StepUpDialog from './index'

const withStatus = (status: StepUpStatus) => ({
  decorators: [withMockProvider({ shadcn: true, initialState: { stepUp: { status } } })],
})

const meta = {
  title: 'Features/OidcAuth/StepUpDialog',
  component: StepUpDialog,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StepUpDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Prompt: Story = withStatus('prompt')

export const Waiting: Story = withStatus('waiting')

export const PopupBlocked: Story = withStatus('blocked')

export const Failed: Story = withStatus('failed')
