import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type ChangeThresholdViewProps = {
  threshold?: number | false
  ownersCount: number
  warning: ReactNode
}

export function ChangeThresholdView({ threshold, ownersCount, warning }: ChangeThresholdViewProps) {
  return (
    <>
      {warning}

      <div>
        <Typography variant="paragraph-small" className="block text-muted-foreground mb-1">
          Any transaction will require the confirmation of:
        </Typography>

        <Typography aria-label="threshold">
          <b>{threshold}</b> out of{' '}
          <b>
            {ownersCount} signer{maybePlural(ownersCount)}
          </b>
        </Typography>
      </div>
      <div className="my-2">
        <Separator bleed="6" />
      </div>
    </>
  )
}
