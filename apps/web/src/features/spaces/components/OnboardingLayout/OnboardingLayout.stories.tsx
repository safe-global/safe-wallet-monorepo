import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { OnboardingLayout, StepCounter, SafeAppMockup } from '.'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'

const defaultSetup = createMockStory({ shadcn: true })

const meta = {
  component: OnboardingLayout,
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof OnboardingLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Step1WithSwitcherHighlight: Story = {
  args: {
    main: (
      <>
        <StepCounter currentStep={1} totalSteps={4} />
        <Typography variant="h2">Create a Workspace</Typography>
      </>
    ),
    footer: (
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="lg">
          Back
        </Button>
        <Button size="lg">Next</Button>
      </div>
    ),
    sidePanel: <SafeAppMockup name="Treasury Ops" highlight="switcher" />,
  },
}

export const Step2WithAccountsHighlight: Story = {
  args: {
    main: (
      <>
        <StepCounter currentStep={2} totalSteps={4} />
        <Typography variant="h2">Select Safes</Typography>
      </>
    ),
    footer: (
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="lg">
          Back
        </Button>
        <Button size="lg">Next</Button>
      </div>
    ),
    sidePanel: <SafeAppMockup name="Treasury Ops" highlight="accounts" />,
  },
}

export const Step4Done: Story = {
  args: {
    main: (
      <>
        <StepCounter currentStep={4} totalSteps={4} />
        <Typography variant="h2">How will you use Safe?</Typography>
      </>
    ),
    footer: (
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="lg">
          Back
        </Button>
        <Button size="lg">Create Workspace</Button>
      </div>
    ),
    sidePanel: <SafeAppMockup name="Treasury Ops" highlight="accounts" />,
  },
}
