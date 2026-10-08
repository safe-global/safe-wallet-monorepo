import type { ReactElement, ReactNode } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import FailedIcon from '@/public/images/common/tx-failed.svg'
import type { SafeCreationEvent } from '@/features/counterfactual/services'

const STEPS: Record<`${SafeCreationEvent}`, { description: string; instruction: string }> = {
  AWAITING_EXECUTION: {
    description: 'Your account is awaiting activation',
    instruction: 'Activate the account to unlock all features of your smart wallet',
  },
  PROCESSING: {
    description: 'We are activating your account',
    instruction: 'It can take some minutes to create your account, but you can check the progress below.',
  },
  RELAYING: {
    description: 'We are activating your account',
    instruction: 'It can take some minutes to create your account, but you can check the progress below.',
  },
  FAILED: {
    description: "Your account couldn't be created",
    instruction:
      'The creation transaction was rejected by the connected wallet. You can retry or create an account from scratch.',
  },
  REVERTED: {
    description: "Your account couldn't be created",
    instruction: 'The creation transaction reverted. You can retry or create an account from scratch.',
  },
  SUCCESS: {
    description: 'Your Safe account is being indexed..',
    instruction: 'The account will be ready for use shortly. Please do not leave this page.',
  },
  INDEXED: {
    description: 'Your Safe account was successfully created!',
    instruction: '',
  },
}

export type StatusMessageViewProps = {
  status: SafeCreationEvent
  isError: boolean
  spinner: ReactNode
  explorerHref?: string
}

export function StatusMessageView({ status, isError, spinner, explorerHref }: StatusMessageViewProps): ReactElement {
  const stepInfo = STEPS[status]

  return (
    <>
      <div data-testid="safe-status-info" className="mt-6 px-6">
        <div className="mx-auto flex h-40 w-40">{isError ? <FailedIcon /> : spinner}</div>
        <Typography variant="h3" className="mt-4">
          {stepInfo.description}
        </Typography>
      </div>
      <div className="mx-auto max-w-[390px]">
        {stepInfo.instruction && (
          <Typography variant="paragraph-small" className="my-4 block">
            {stepInfo.instruction}
          </Typography>
        )}
        {!isError && explorerHref && <ExternalLink href={explorerHref}>Check status on block explorer</ExternalLink>}
      </div>
    </>
  )
}
