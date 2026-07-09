import type { Meta, StoryObj } from '@storybook/react'
import OnboardingFooter from './index'

/**
 * OnboardingFooter — the Back / Continue footer for the full-screen Spaces
 * onboarding flows. Owns the `size="xl"` (48px) scale, Back(secondary)/Continue,
 * chevrons, loading→spinner, and the stacked-mobile → row-on-xl layout.
 */
const meta = {
  title: 'Components/Common/OnboardingFooter',
  component: OnboardingFooter,
  args: { continueLabel: 'Next' },
} satisfies Meta<typeof OnboardingFooter>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Back + Continue</h3>
        <OnboardingFooter onBack={() => {}} continueLabel="Next" onContinue={() => {}} />
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Loading</h3>
        <OnboardingFooter onBack={() => {}} continueLabel="Create Workspace" onContinue={() => {}} continueLoading />
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Continue-only (first step)</h3>
        <OnboardingFooter continueLabel="Get started" onContinue={() => {}} />
      </div>
      <p className="text-sm text-muted-foreground">
        On mobile the buttons stack (continue on top); from <code>xl</code> up they sit side by side.
      </p>
    </div>
  ),
}
