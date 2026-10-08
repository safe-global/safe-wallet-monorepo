import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import css from '@/components/new-safe/create/steps/ReviewStep/styles.module.css'
import ReviewRow from '@/components/new-safe/ReviewRow'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type SafeReviewStepViewProps = {
  chainIndicator: ReactElement
  name: string
  ownerInfos: ReactNode
  threshold: number
  ownerCount: number
  onBack: () => void
  onAdd: () => void
}

export function SafeReviewStepView({
  chainIndicator,
  name,
  ownerInfos,
  threshold,
  ownerCount,
  onBack,
  onAdd,
}: SafeReviewStepViewProps): ReactElement {
  return (
    <>
      <div className={layoutCss.row}>
        <div className="grid grid-cols-12 gap-6">
          <ReviewRow name="Network" value={chainIndicator} />
          <ReviewRow name="Name" value={<Typography>{name}</Typography>} />
          <ReviewRow name="Signers" value={<div className={css.ownersArray}>{ownerInfos}</div>} />
          <ReviewRow
            name="Threshold"
            value={
              <Typography>
                {threshold} out of {ownerCount} signer{maybePlural(ownerCount)}
              </Typography>
            }
          />
        </div>
      </div>
      <Separator />
      <div className={layoutCss.row}>
        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            Back
          </Button>
          <Button type="button" size="lg" onClick={onAdd}>
            Add
          </Button>
        </div>
      </div>
    </>
  )
}
