import type { ReactElement } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useTrialSizes } from './hooks/useTrialSizes'
import { useWorkspaceDraft } from './hooks/useWorkspaceDraft'
import { getPickedSize } from './validation'

/** Under the last step: what "Start free trial" is about to do. */
const TrialConfirmNote = (): ReactElement | null => {
  const isSafePro = useIsSafeProEnabled()
  const { draft } = useWorkspaceDraft()
  const { sizes } = useTrialSizes()
  const size = getPickedSize(draft, { sizes })

  if (!isSafePro || !size) return null

  return (
    <Typography variant="paragraph-small" color="muted" data-testid="trial-confirm-note">
      Next, you&apos;ll confirm your {size.planName} ({size.seats} Safes) trial on Stripe. No card needed, and you
      won&apos;t be charged when it ends. Changed your mind? Go back to switch plans.
    </Typography>
  )
}

export default TrialConfirmNote
