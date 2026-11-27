import { useEffect, useRef, useState, type ContextType, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import type { Meta, StoryObj } from '@storybook/react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Typography } from '@safe-global/views/components/ui/typography'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
// eslint-disable-next-line no-restricted-imports -- story-only prototype: the barrel's SafeShieldWidget hooks never settle in Storybook, so the display is fed mock analysis
import { SafeShieldDisplay } from '@/features/safe-shield/components/SafeShieldDisplay'
// eslint-disable-next-line no-restricted-imports -- story-only prototype: the refused case swaps in a red header
import { SafeShieldHeader } from '@/features/safe-shield/components/SafeShieldHeader'
import {
  RecipientStatus,
  Severity,
  StatusGroup,
  type RecipientAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { createPoliciesM2Story } from '../m2Prototype'

// Copy of the engineering allowlist demo's PolicyGuardCheck, messages unchanged.
const REFUSED = "This account's policies will refuse this transaction."

type Verdict = 'allowed' | 'refused'

const PolicyGuardCheck = ({ verdict }: { verdict: Verdict }): ReactElement => {
  const variant = verdict === 'refused' ? 'destructive' : 'success'
  return (
    <Alert variant={variant} data-testid="policy-guard-check" data-m2-new="Allowlist demo · Policy check">
      <AlertSeverityIcon variant={variant} />
      <AlertDescription>{verdict === 'refused' ? REFUSED : 'Policy checks passed'}</AlertDescription>
    </Alert>
  )
}

const ALLOWED_RECIPIENT = '0x4bC91D2E3F4a5B6C7D8e9F0a1b2C3d4E5f60A88B'
const OTHER_RECIPIENT = '0x6D0a9f2c71b8e04d6a3c5b17e92f08d4c6a13e58'

const RECIPIENTS: Record<Verdict, RecipientAnalysisResults> = {
  allowed: {
    [ALLOWED_RECIPIENT]: {
      [StatusGroup.ADDRESS_BOOK]: [
        {
          severity: Severity.OK,
          type: RecipientStatus.KNOWN_RECIPIENT,
          title: 'Known recipient',
          description: 'This address is in your address book.',
        },
      ],
      [StatusGroup.RECIPIENT_INTERACTION]: [
        {
          severity: Severity.OK,
          type: RecipientStatus.RECURRING_RECIPIENT,
          title: 'Recurring recipient',
          description: 'You have interacted with this address 12 times.',
        },
      ],
    },
  },
  refused: {
    [OTHER_RECIPIENT]: {
      [StatusGroup.ADDRESS_BOOK]: [
        {
          severity: Severity.INFO,
          type: RecipientStatus.UNKNOWN_RECIPIENT,
          title: 'Unknown recipient',
          description: 'This address is not in your address book or a Safe account owned by you.',
        },
      ],
      [StatusGroup.RECIPIENT_INTERACTION]: [
        {
          severity: Severity.INFO,
          type: RecipientStatus.NEW_RECIPIENT,
          title: 'New recipient',
          description: 'You have not interacted with this address before.',
        },
      ],
    },
  },
}

const IDLE: AsyncResult<never> = [undefined, undefined, false]

const SIMULATED = { isLoading: false, isFinished: true, isSuccess: true, isCallTraceError: false, isError: false }

const simulationRequest = {
  _simulationRequestStatus: 'NOT_ASKED',
  simulationData: undefined,
  simulateTransaction: () => {},
  simulationLink: '',
  resetSimulation: () => {},
}

/** A finished Tenderly run, as the setup's Safe Shield shows it. */
const SIMULATION = {
  simulation: simulationRequest,
  status: SIMULATED,
  nestedTx: { simulation: simulationRequest, status: SIMULATED },
} as unknown as ContextType<typeof TxInfoContext>

/** The demo places the policy verdict first in the Pro checks; SafeShieldDisplay has no slot, so it's portalled in. */
const ShieldWithPolicyCheck = ({ verdict }: { verdict: Verdict }): ReactElement => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const find = () => {
      const root = rootRef.current
      const list = root?.querySelector<HTMLElement>('[data-testid=pro-checks-section] > div:last-child')
      const header = root?.querySelector<HTMLElement>('[data-testid=safe-shield-status]')?.parentElement
      if (!list || !header) return false
      const holder = document.createElement('div')
      list.prepend(holder)
      setSlot(holder)
      // A refusal outranks the other checks, so the header turns red; the display can't be told, so its header is swapped.
      if (verdict === 'refused') {
        const headerHolder = document.createElement('div')
        header.before(headerHolder)
        header.style.display = 'none'
        setHeaderSlot(headerHolder)
      }
      return true
    }
    if (find()) return
    const timer = setInterval(() => find() && clearInterval(timer), 100)
    return () => clearInterval(timer)
  }, [verdict])

  return (
    <div ref={rootRef}>
      <TxInfoContext.Provider value={SIMULATION}>
        <SafeShieldDisplay
          recipient={[RECIPIENTS[verdict], undefined, false]}
          contract={IDLE}
          threat={IDLE}
          deadlock={IDLE}
          showHypernativeInfo={false}
          showHypernativeActiveStatus={false}
          safeAnalysis={null}
          hasProFeatures
          isSafePro
        />
      </TxInfoContext.Provider>
      {slot && createPortal(<PolicyGuardCheck verdict={verdict} />, slot)}
      {headerSlot &&
        createPortal(
          <SafeShieldHeader
            recipient={[RECIPIENTS[verdict], undefined, false]}
            contract={IDLE}
            threat={IDLE}
            deadlock={IDLE}
            overallStatus={{ severity: Severity.CRITICAL, title: 'Blocked by policy' }}
          />,
          headerSlot,
        )}
    </div>
  )
}

const CASES: { verdict: Verdict; title: string; detail: string }[] = [
  { verdict: 'allowed', title: 'Allowed recipient and token', detail: 'Send 500 USDT to Payroll — Deel' },
  { verdict: 'refused', title: 'Recipient not on the allowlist', detail: 'Send 500 USDT to 0x6D0a…3e58' },
]

/** Spec 8.1: Safe Shield on a transfer from a Safe account with an allowlist, before signing. */
const SafeShieldTransfer = (): ReactElement => (
  <div className="flex min-h-screen flex-wrap items-start gap-10 bg-background p-10 text-foreground">
    {CASES.map(({ verdict, title, detail }) => (
      <section key={verdict} className="flex w-80 flex-col gap-3" data-m2-frame={`shield-${verdict}`}>
        <div className="flex flex-col gap-0.5">
          <Typography variant="paragraph-small-medium">{title}</Typography>
          <Typography variant="paragraph-small" color="muted">
            {detail}
          </Typography>
        </div>
        <ShieldWithPolicyCheck verdict={verdict} />
      </section>
    ))}
  </div>
)

const shell = createPoliciesM2Story({ wallet: 'owner', notifications: false })

const meta = {
  title: 'Prototype/Policy engine/Allowlist MVP · final design 2026/Safe Shield on transfers',
  id: 'prototype-allowlist-mvp-safe-shield',
  component: SafeShieldTransfer,
  decorators: [shell.decorator],
  parameters: { ...shell.parameters, layout: 'fullscreen' },
} satisfies Meta<typeof SafeShieldTransfer>

export default meta

export const Transfers: StoryObj<typeof meta> = {}
