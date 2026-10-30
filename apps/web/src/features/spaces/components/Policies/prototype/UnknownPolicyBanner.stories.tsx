import { useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AppRoutes } from '@/config/routes'
import { Button } from '@safe-global/views/components/ui/button'
import { Card } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { M2Alert } from './m2Alert'
import { createM1FlowStory, PAYMENTS, SafeAddress, type M2Account } from './m2Prototype'
import { CREATE_STEP, DEFAULT_CHOICES, SETUP_PREVIEW_HANDLERS, SetUpPoliciesFlow, WIZARD_STORE } from './m2SetupFlow'

/**
 * One-off handoff for the MVP: the unknown-policy banner on Create.
 * Not wired into the full-flow prototype.
 */

const UNKNOWN_POLICIES = [
  { name: 'Unknown policy 1', address: '0x55c2a7e1b4d3f8c9a0e6b2d4f7a1c3e5b9d0ae95' },
  { name: 'Unknown policy 2', address: '0x8f3b1d6e2a9c4b7f0e5d3a1c8b6e4f2a9d7c31b0' },
]

const UnknownPolicyBanner = (): ReactElement => (
  <M2Alert
    tone="error"
    title="This Safe account has an unknown policy installed"
    description={
      <div className="flex flex-col gap-4">
        <span>A Safe account can only have one policy of this kind, remove it to set up an allowlist.</span>

        <div className="flex flex-col gap-3">
          {UNKNOWN_POLICIES.map(({ name, address }) => (
            // Hovering the address shows the full address with copy and explorer buttons.
            <SafeAddress key={address} name={name} address={address} />
          ))}
        </div>

        <Button variant="outline" size="sm" className="self-start" render={<a href={AppRoutes.settings.modules} />}>
          Go to Safe settings
        </Button>
      </div>
    }
  />
)

const SettingsButton = (): ReactElement => (
  <Button variant="outline" size="sm" className="shrink-0" render={<a href={AppRoutes.settings.modules} />}>
    Go to Safe settings
  </Button>
)

/** Option A: the policies sit in a white inset card, the button in the banner's action slot next to the problem. */
const InsetCardBanner = (): ReactElement => (
  <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4" data-m2-new="Option A">
    <M2Alert
      tone="error"
      className="border-0 bg-transparent p-0"
      title="This Safe account has an unknown policy installed"
      description="A Safe account can only have one policy of this kind, remove it to set up an allowlist."
      action={<SettingsButton />}
    />
    <Card size="none" className="divide-y divide-border">
      {UNKNOWN_POLICIES.map(({ name, address }) => (
        <div key={address} className="px-3 py-2.5">
          <SafeAddress name={name} address={address} />
        </div>
      ))}
    </Card>
  </div>
)

/** Option B: a short red banner says what's wrong and how to fix it; the details sit below it in neutral. */
const SplitBanner = (): ReactElement => (
  <div className="flex flex-col gap-3" data-m2-new="Option B">
    <M2Alert
      tone="error"
      title="This Safe account has an unknown policy installed"
      description="A Safe account can only have one policy of this kind, remove it to set up an allowlist."
      action={<SettingsButton />}
    />
    <div className="flex flex-col gap-2">
      <Typography variant="paragraph-small-medium">Installed policies</Typography>
      <Card variant="outlined" size="none" className="divide-y divide-border">
        {UNKNOWN_POLICIES.map(({ name, address }) => (
          <div key={address} className="px-3 py-2.5">
            <SafeAddress name={name} address={address} />
          </div>
        ))}
      </Card>
    </div>
  </div>
)

const BANNERS = { current: UnknownPolicyBanner, insetCard: InsetCardBanner, split: SplitBanner }

/** The Create step's card, cut down to what matters here: the header, then the banner under the account field. */
/** The prototype's real Create step on an account with an unknown policy, with the banner swapped for the option. */
const CreateStepWithBanner = ({ variant = 'current' }: { variant?: keyof typeof BANNERS }): ReactElement => {
  const Banner = BANNERS[variant]
  const [step, setStep] = useState(CREATE_STEP)
  const [account, setAccount] = useState<M2Account | undefined>(PAYMENTS)
  const [choices, setChoices] = useState(DEFAULT_CHOICES)

  return (
    <SetUpPoliciesFlow
      account={account}
      onAccountChange={setAccount}
      step={step}
      onStepChange={setStep}
      choices={choices}
      onChoicesChange={setChoices}
      preflight="other-guard"
      preflightBanner={<Banner />}
      inline
    />
  )
}

// The same setup as the "Set up policies flow" stories, so the step renders exactly as in the prototype.
const shell = createM1FlowStory({ store: WIZARD_STORE })

const meta = {
  title: 'Prototype/Handoff – unknown policy banner',
  component: CreateStepWithBanner,
  decorators: [shell.decorator],
  parameters: {
    ...shell.parameters,
    msw: { handlers: [...SETUP_PREVIEW_HANDLERS, ...shell.parameters.msw.handlers] },
  },
} satisfies Meta<typeof CreateStepWithBanner>

export default meta
type Story = StoryObj<typeof meta>

export const UnknownPolicies: Story = {}

/** Option A: one red block, the policies in a white inset card, the button next to the title. */
export const OptionAInsetCard: Story = { args: { variant: 'insetCard' } }

/** Option B: a short red banner with the button, the policies listed below in neutral. */
export const OptionBSplit: Story = { args: { variant: 'split' } }
