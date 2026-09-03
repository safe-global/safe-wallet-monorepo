import { useState } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import StartTrialModal from './StartTrialModal'

const DAY_MS = 24 * 60 * 60 * 1000

export default function TrialFlow({
  trialDays,
  open,
  onOpenChange,
}: {
  trialDays: 30 | 60
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { SafeProTrialActivatedModal } = useLoadFeature(SafeProFeature)
  const [trialEndsAt, setTrialEndsAt] = useState<number>()

  return (
    <>
      <StartTrialModal
        trialDays={trialDays}
        open={open}
        onOpenChange={onOpenChange}
        onContinue={() => {
          onOpenChange(false)
          setTrialEndsAt(Date.now() + trialDays * DAY_MS)
        }}
      />
      <SafeProTrialActivatedModal
        open={trialEndsAt !== undefined}
        onOpenChange={() => setTrialEndsAt(undefined)}
        trialEndsAt={trialEndsAt ?? 0}
      />
    </>
  )
}
