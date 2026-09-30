import type { Meta, StoryObj } from '@storybook/react'
import OnboardingFooter from './index'

/**
 * OnboardingFooter — the Back / Continue footer for the full-screen Spaces
 * onboarding flows. Owns the `size="xl"` (48px) scale, Back(secondary)/Continue,
 * loading→spinner, and the shared row that stacks only when space runs out.
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
        Back and Continue share one row, each taking half of it. Below about 340px a long label such as &ldquo;Create
        Workspace&rdquo; no longer fits beside Back, and the two stack full-width instead of clipping.
      </p>
    </div>
  ),
}
