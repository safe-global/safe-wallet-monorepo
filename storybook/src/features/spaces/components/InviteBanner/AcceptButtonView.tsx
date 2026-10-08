import type { MouseEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export type AcceptButtonViewProps = {
  onClick: (e: MouseEvent) => void
  dialog?: ReactNode
}

export const AcceptButtonView = ({ onClick, dialog }: AcceptButtonViewProps) => {
  return (
    <>
      <Button data-testid="accept-invite-button" onClick={onClick} aria-label="Accept invitation" size="sm">
        Accept
      </Button>
      {dialog}
    </>
  )
}
