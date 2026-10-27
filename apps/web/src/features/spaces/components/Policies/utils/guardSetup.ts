import type {
  GuardSetup,
  GuardSetupProgress,
  GuardSetupStep,
  GuardSetupStepState,
  GuardSetupTransaction,
} from '@safe-global/views/features/spaces/components/Policies/types'

const nowInSeconds = (): number => Math.floor(Date.now() / 1000)

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return 'less than a minute'

  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`

  const days = Math.floor(hours / 24)
  return hours % 24 ? `${days}d ${hours % 24}h` : `${days}d`
}

const isSigned = (tx: GuardSetupTransaction): boolean => tx.confirmationsSubmitted >= tx.confirmationsRequired

const formatSignatures = (tx: GuardSetupTransaction): string =>
  `${tx.confirmationsSubmitted} of ${tx.confirmationsRequired} signatures`

const REQUEST_TITLE = 'Request change'
const DELAY_TITLE = 'Security delay'
const APPLY_TITLE = 'Apply change'

const immediateProgress = (transaction: GuardSetupTransaction): GuardSetupProgress => {
  const signed = isSigned(transaction)

  return {
    status: signed ? 'ready-to-execute' : 'needs-signatures',
    summary: signed ? 'Step 2 of 2 · Ready to execute' : `Step 1 of 2 · ${formatSignatures(transaction)}`,
    action: 'review-transaction',
    steps: [
      {
        id: 'sign',
        title: 'Collect signatures',
        description: signed ? 'Signed by the owners.' : formatSignatures(transaction),
        state: signed ? 'complete' : 'current',
      },
      {
        id: 'execute',
        title: 'Execute transaction',
        description: 'Turns on the policy guard and this policy in one transaction.',
        state: signed ? 'current' : 'upcoming',
      },
    ],
  }
}

const requestStep = (state: GuardSetupStepState, description: string): GuardSetupStep => ({
  id: 'request',
  title: REQUEST_TITLE,
  description,
  state,
})

const DELAY_UPCOMING: GuardSetupStep = {
  id: 'delay',
  title: DELAY_TITLE,
  description: 'Starts once the request executes. Owners can spot and stop an unwanted change meanwhile.',
  state: 'upcoming',
}

const APPLY_UPCOMING: GuardSetupStep = {
  id: 'apply',
  title: APPLY_TITLE,
  description: 'Available once the security delay ends.',
  state: 'upcoming',
}

type ApplyStage = Pick<GuardSetupProgress, 'status' | 'action'> & { step: GuardSetupStep; label: string }

/** The apply step once the change is requested on chain: the delay may still be running. */
const applyStage = (
  transaction: GuardSetupTransaction | null,
  isDelayOver: boolean,
  expiresIn: number | null,
): ApplyStage => {
  const deadline = expiresIn === null ? '' : ` Apply within ${formatDuration(expiresIn)}.`

  if (!transaction) {
    return isDelayOver
      ? {
          status: 'ready-to-apply',
          action: 'apply',
          label: 'Ready to apply',
          step: {
            ...APPLY_UPCOMING,
            description: `Propose the apply transaction to turn the change on.${deadline}`,
            state: 'current',
          },
        }
      : { status: 'security-delay', action: null, label: 'Ready to apply', step: APPLY_UPCOMING }
  }

  if (!isSigned(transaction)) {
    return {
      status: isDelayOver ? 'needs-signatures' : 'security-delay',
      action: 'review-transaction',
      label: formatSignatures(transaction),
      step: {
        ...APPLY_UPCOMING,
        description: isDelayOver
          ? `${formatSignatures(transaction)}.${deadline}`
          : `${formatSignatures(transaction)}. Owners can sign while the delay runs.`,
        state: 'current',
      },
    }
  }

  return {
    status: isDelayOver ? 'ready-to-execute' : 'security-delay',
    action: 'review-transaction',
    label: 'Ready to execute',
    step: {
      ...APPLY_UPCOMING,
      description: isDelayOver
        ? `Signed. Execute it to turn the change on.${deadline}`
        : 'Signed. It can be executed once the delay ends.',
      state: 'current',
    },
  }
}

const delayedProgress = (setup: Extract<GuardSetup, { flow: 'delayed' }>, now: number): GuardSetupProgress => {
  const { status, transaction, readyAt, expiresAt } = setup

  if (status === 'draft') {
    return {
      status: 'not-requested',
      summary: 'Not requested yet',
      action: 'request',
      steps: [
        requestStep('current', 'Saved, but no request transaction was proposed. Propose it to start the change.'),
        DELAY_UPCOMING,
        APPLY_UPCOMING,
      ],
    }
  }

  if (status === 'configuration-in-signing' && transaction) {
    const signed = isSigned(transaction)

    return {
      status: signed ? 'ready-to-execute' : 'needs-signatures',
      summary: `Step 1 of 3 · ${signed ? 'Ready to execute' : formatSignatures(transaction)}`,
      action: 'review-transaction',
      steps: [
        requestStep(
          'current',
          signed ? 'Signed. Execute it to start the security delay.' : `${formatSignatures(transaction)}.`,
        ),
        DELAY_UPCOMING,
        APPLY_UPCOMING,
      ],
    }
  }

  const requested = requestStep('complete', 'Approved by the owners.')

  // The apply window can close between two polls, so the clock decides as well as CGW.
  if (status === 'expired' || (expiresAt !== null && now >= expiresAt)) {
    return {
      status: 'expired',
      summary: 'Expired · request it again',
      action: 'request',
      steps: [
        requested,
        { ...DELAY_UPCOMING, description: 'Ended.', state: 'complete' },
        {
          ...APPLY_UPCOMING,
          description: 'It was not applied in time. Request the change again to restart the security delay.',
          state: 'failed',
        },
      ],
    }
  }

  const delayLeft = readyAt === null ? 0 : readyAt - now
  const isDelayOver = delayLeft <= 0
  const apply = applyStage(transaction, isDelayOver, expiresAt === null ? null : expiresAt - now)

  return {
    status: apply.status,
    action: apply.action,
    summary: isDelayOver ? `Step 3 of 3 · ${apply.label}` : `Step 2 of 3 · Ready in ${formatDuration(delayLeft)}`,
    steps: [
      requested,
      isDelayOver
        ? { ...DELAY_UPCOMING, description: 'Ended.', state: 'complete' }
        : {
            ...DELAY_UPCOMING,
            description: `Ends in ${formatDuration(delayLeft)}. Owners can spot and stop an unwanted change meanwhile.`,
            state: 'current',
          },
      apply.step,
    ],
  }
}

/** Where a guard change stands, step by step, as of `now` (unix seconds). */
export const getGuardSetupProgress = (setup: GuardSetup, now: number = nowInSeconds()): GuardSetupProgress =>
  setup.flow === 'immediate' ? immediateProgress(setup.transaction) : delayedProgress(setup, now)
