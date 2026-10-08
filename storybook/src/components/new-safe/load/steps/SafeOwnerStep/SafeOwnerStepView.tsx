import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import layoutCss from '@/components/new-safe/create/styles.module.css'

export type SafeOwnerStepViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  onBack: () => void
  isValid: boolean
  ownerRows: ReactNode
}

export function SafeOwnerStepView({ onSubmit, onBack, isValid, ownerRows }: SafeOwnerStepViewProps): ReactElement {
  return (
    <form onSubmit={onSubmit}>
      <div className={layoutCss.row}>{ownerRows}</div>
      <Separator />
      <div className={layoutCss.row}>
        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" size="lg" disabled={!isValid}>
            Next
          </Button>
        </div>
      </div>
    </form>
  )
}
