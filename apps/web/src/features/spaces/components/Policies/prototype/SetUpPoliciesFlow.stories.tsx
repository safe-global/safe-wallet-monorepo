import { useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { getAllowlistAccountKeys } from './m2OverviewPage'
import { createM1FlowStory, PAYMENTS, type M2Account } from './m2Prototype'
import {
  CONFIRM_STEP,
  CREATE_STEP,
  DEFAULT_CHOICES,
  INTRO_STEP,
  EXECUTE_STEP,
  PREFILLED_RECIPIENTS,
  PERMISSIONS_STEP,
  SETTINGS_STEP,
  REVIEW_STEP,
  SecondSignerConfirm,
  SETUP_PREVIEW_HANDLERS,
  SetUpPoliciesFlow,
  WIZARD_STEP_NAMES,
  WIZARD_STORE,
  type Preflight,
  type SetupChoices,
  type WizardMode,
} from './m2SetupFlow'

type WizardStoryProps = {
  initialStep: number
  /** Null starts on Create with only the account dropdown. */
  initialAccount?: M2Account | null
  initialChoices?: SetupChoices
  preflight?: Preflight
  mode?: WizardMode
  /** Edit only: the allowlist as it is now, so Review marks what's added and removed. */
  liveChoices?: SetupChoices
  onSign?: () => void
  onClose?: () => void
}

const WizardStory = ({
  initialStep,
  initialAccount = PAYMENTS,
  initialChoices = DEFAULT_CHOICES,
  preflight,
  mode,
  liveChoices,
  onSign,
  onClose,
}: WizardStoryProps): ReactElement => {
  const [step, setStep] = useState(initialStep)
  const [account, setAccount] = useState(initialAccount ?? undefined)
  const [choices, setChoices] = useState(initialChoices)

  return (
    <SetUpPoliciesFlow
      account={account}
      onAccountChange={setAccount}
      disabledAccountKeys={getAllowlistAccountKeys({ state: 'not-set-up', signedCount: 0, pendingChange: false })}
      step={step}
      onStepChange={setStep}
      choices={choices}
      onChoicesChange={setChoices}
      preflight={preflight}
      mode={mode}
      initialChoices={liveChoices}
      inline
      onSign={onSign}
      onClose={onClose}
    />
  )
}

// M1's "Create new policy" story setup and rendering (TxFlow straight in the page), so the two compare like for like.
const shell = createM1FlowStory({ store: WIZARD_STORE })

const meta = {
  title: 'Prototype/Set up policies flow',
  component: WizardStory,
  decorators: [shell.decorator],
  parameters: {
    ...shell.parameters,
    msw: { handlers: [...SETUP_PREVIEW_HANDLERS, ...shell.parameters.msw.handlers] },
  },
  args: {
    initialStep: CREATE_STEP,
    preflight: 'ready',
    onSign: fn(),
    onClose: fn(),
  },
  argTypes: {
    initialStep: { control: { type: 'number', min: 0, max: WIZARD_STEP_NAMES.length - 1 } },
    preflight: {
      control: 'select',
      options: ['ready', 'old-version', 'other-guard'],
    },
  },
} satisfies Meta<typeof WizardStory>

export default meta
type Story = StoryObj<typeof meta>

/** The onboarding's first page: how account protection works, with "I understand" before Get started. */
export const HowItWorks: Story = {
  args: { initialStep: INTRO_STEP },
}

/** Create before an account is picked: M1's dropdown alone; accounts with an allowlist are disabled. */
export const CreateNoAccount: Story = {
  args: { initialAccount: null },
}

/** Create: checks pass; the recipients to allow. */
export const Create: Story = {}

/** Create blocked: the Safe is older than 1.3.0. */
export const CreateOldVersion: Story = {
  args: { preflight: 'old-version' },
}

/** Create blocked: an unknown policy is installed and has to be removed first. */
export const CreateAnotherGuard: Story = {
  args: { preflight: 'other-guard' },
}

/** No payment history: Continue stays disabled until a recipient is added. */
export const CreateNoRecipients: Story = {
  args: { initialChoices: { ...DEFAULT_CHOICES, recipients: [] } },
}

/** Safe account settings: which changes to the Safe account the allowlist still lets through. */
export const Settings: Story = {
  args: { initialStep: SETTINGS_STEP },
}

/** Permissions ("Existing policies"): Payments' spending limits, one blocked since USDC starts unchecked. */
export const Permissions: Story = {
  args: { initialStep: PERMISSIONS_STEP },
}

/** Review ("Confirm policies"): M1's confirm-screen summary for the policies about to be turned on. */
export const Review: Story = {
  args: { initialStep: REVIEW_STEP },
}

/** Confirm: M1's "Review details" receipt, with Sign. */
export const Confirm: Story = {
  args: { initialStep: CONFIRM_STEP },
}

/** Execute: the same receipt once every signature is in, with Execute. */
export const Execute: Story = {
  args: { initialStep: EXECUTE_STEP },
}

/** What a second signer sees when they open the setup to confirm it. */
export const SecondSignerConfirmView: Story = {
  name: 'SecondSignerConfirm',
  render: (args) => <SecondSignerConfirm choices={DEFAULT_CHOICES} onConfirm={args.onSign} onClose={args.onClose} />,
}

/** Payments' allowlist with its first recipient removed: the edit the edit stories walk through. */
const EDITED_CHOICES: SetupChoices = {
  ...DEFAULT_CHOICES,
  recipients: PREFILLED_RECIPIENTS.map((recipient, index) =>
    index === 0 ? { ...recipient, selected: false } : recipient,
  ),
}

const EDIT_ARGS = { mode: 'edit', liveChoices: DEFAULT_CHOICES, initialChoices: EDITED_CHOICES } as const

/** Edit an allowlist on an already protected Safe account: the short wizard, Allowlist → Review → Confirm → Execute. */
export const EditAllowlist: Story = {
  args: EDIT_ARGS,
}

/** Edit, Review: executing the edit starts a 24-hour wait, and a second transaction applies it. */
export const EditReview: Story = {
  args: { ...EDIT_ARGS, initialStep: REVIEW_STEP },
}

/** Edit, Execute: starts the 24-hour wait. */
export const EditExecute: Story = {
  args: { ...EDIT_ARGS, initialStep: EXECUTE_STEP },
}
