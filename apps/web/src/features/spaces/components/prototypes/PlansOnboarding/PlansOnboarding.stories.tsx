import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import OnboardingPrototype from './OnboardingPrototype'
import TrialPickerModal from './TrialPickerModal'

const setup = createMockStory({ shadcn: true })

const meta = {
  title: 'Prototypes/Plans and onboarding',
  component: OnboardingPrototype,
  parameters: { layout: 'fullscreen', ...setup.parameters },
  decorators: [setup.decorator],
  tags: ['skip-visual-test'],
} satisfies Meta<typeof OnboardingPrototype>

export default meta
type Story = StoryObj<typeof meta>

/** The five-step flow from the start; "Start free trial" on the last step opens a mocked Stripe Checkout. */
export const Onboarding: Story = {}

export const PickPlan: Story = { args: { initialStep: 'plan' } }

export const SelectSafes: Story = { args: { initialStep: 'safes' } }

export const StartTrial: Story = { args: { initialStep: 'survey' } }

/** The trial offer as a plan picker, shown when a new Workspace is created. */
export const TrialModal: Story = {
  render: () => <TrialPickerModal />,
}
