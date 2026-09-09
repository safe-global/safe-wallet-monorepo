import { useState } from 'react'
import type { LinkProps } from 'next/link'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import StartTrialModal from './StartTrialModal'

const DAY_MS = 24 * 60 * 60 * 1000

export default function TrialFlow({
  trialDays,
  open,
  onOpenChange,
  activatedHref,
  selectAccounts,
}: {
  trialDays: 30 | 60
  open: boolean
  onOpenChange: (open: boolean) => void
  selectAccounts?: boolean
  /** Where the confirmation's CTA leads; the locked dashboard just closes it. */
  activatedHref?: LinkProps['href']
}) {
  const { SafeProTrialActivatedModal } = useLoadFeature(SafeProFeature)
  const [trialEndsAt, setTrialEndsAt] = useState<number>()

  return (
    <>
      <StartTrialModal
        trialDays={trialDays}
        open={open}
        onOpenChange={onOpenChange}
        selectAccounts={selectAccounts}
        onContinue={() => {
          onOpenChange(false)
          setTrialEndsAt(Date.now() + trialDays * DAY_MS)
        }}
      />
      <SafeProTrialActivatedModal
        open={trialEndsAt !== undefined}
        onOpenChange={() => setTrialEndsAt(undefined)}
        trialEndsAt={trialEndsAt ?? 0}
        ctaHref={activatedHref}
      />
    </>
  )
}
