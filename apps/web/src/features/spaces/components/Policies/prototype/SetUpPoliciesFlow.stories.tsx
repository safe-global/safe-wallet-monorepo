import { useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { getAllowlistAccountKeys } from './m2OverviewPage'
import { createM1FlowStory, PAYMENTS, type M2Account } from './m2Prototype'
import {
  CONFIRM_STEP,
  DEFAULT_CHOICES,
  EXECUTE_STEP,
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
} from './m2SetupFlow'

type WizardStoryProps = {
  initialStep: number
  /** Null starts on Create with only the account dropdown. */
  initialAccount?: M2Account | null
  initialChoices?: SetupChoices
  preflight?: Preflight
  onSign?: () => void
  onClose?: () => void
}

const WizardStory = ({
  initialStep,
  initialAccount = PAYMENTS,
  initialChoices = DEFAULT_CHOICES,
  preflight,
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
    initialStep: 0,
    preflight: 'ready',
    onSign: fn(),
    onClose: fn(),
  },
  argTypes: {
    initialStep: { control: { type: 'number', min: 0, max: WIZARD_STEP_NAMES.length - 1 } },
    preflight: {
      control: 'select',
      options: ['ready', 'old-version', 'other-guard', 'policy-guard', 'pending-transactions'],
    },
  },
} satisfies Meta<typeof WizardStory>

export default meta
type Story = StoryObj<typeof meta>

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

/** Create blocked: the account already has an allowlist, so that one is edited or deleted instead. */
export const CreateExistingPolicyGuard: Story = {
  args: { preflight: 'policy-guard' },
}

/** Create blocked: transactions are still queued. */
export const CreatePendingTransactions: Story = {
  args: { preflight: 'pending-transactions' },
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
