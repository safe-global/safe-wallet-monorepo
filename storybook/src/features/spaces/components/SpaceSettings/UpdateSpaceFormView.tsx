import type { FormEventHandler, ReactNode } from 'react'
import ErrorAlert from './ErrorAlert'
import { Button } from '@/components/ui/button'

export type UpdateSpaceFormViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  renderNameInput: (label: string) => ReactNode
  error?: string
  canSubmit: boolean
}

export const UpdateSpaceFormView = ({ onSubmit, renderNameInput, error, canSubmit }: UpdateSpaceFormViewProps) => {
  return (
    <form onSubmit={onSubmit}>
      {renderNameInput('Workspace name')}

      <ErrorAlert error={error} />

      <Button data-testid="space-save-button" type="submit" className="mt-4" disabled={!canSubmit}>
        Save
      </Button>
    </form>
  )
}
