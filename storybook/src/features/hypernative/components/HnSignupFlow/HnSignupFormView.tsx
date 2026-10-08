import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import HnSignupLayout from './HnSignupLayout'
import css from './styles.module.css'

export type HnSignupFormViewProps = {
  hubSpotForm: ReactNode
  onCancel?: () => void
}

export const HnSignupFormView = ({ hubSpotForm, onCancel }: HnSignupFormViewProps) => {
  return (
    <HnSignupLayout contentClassName={css.formColumn}>
      <div className={css.formWrapper}>
        {hubSpotForm}
        {onCancel && (
          <div className={css.cancelButtonWrapper}>
            <Button variant="ghost" onClick={onCancel} className={css.cancelButton}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </HnSignupLayout>
  )
}
