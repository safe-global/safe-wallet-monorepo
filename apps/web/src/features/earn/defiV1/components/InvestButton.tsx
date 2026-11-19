import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { DEFI_V1_COPY } from '../copy'
import type { DefiV1Plan } from '../types'

const COPY = DEFI_V1_COPY.operations

/** Primary toolbar action: starts set up investment on Pro, explains Safe Pro on Free. */
export const InvestButton = ({ plan, onInvest }: { plan: DefiV1Plan; onInvest: () => void }) => {
  const [isTeaserOpen, setIsTeaserOpen] = useState(false)

  if (plan === 'pro') {
    return (
      <Button size="action" onClick={onInvest} data-testid="invest-button">
        {COPY.invest}
      </Button>
    )
  }

  return (
    <>
      <Button size="action" onClick={() => setIsTeaserOpen(true)} data-testid="invest-button">
        <Lock />
        {COPY.invest}
      </Button>
      <Dialog open={isTeaserOpen} onOpenChange={setIsTeaserOpen}>
        <DialogContent size="sm" data-testid="invest-teaser">
          <DialogHeader divided="subtle">
            <DialogTitle>{COPY.teaserTitle}</DialogTitle>
            <DialogDescription>{COPY.teaserBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter divided="subtle">
            <Button size="lg">{COPY.seePro}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
