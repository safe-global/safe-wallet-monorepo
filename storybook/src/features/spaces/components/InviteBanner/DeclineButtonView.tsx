import type { MouseEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export type DeclineButtonViewProps = {
  onClick: (e: MouseEvent) => void
  dialog?: ReactNode
}

export const DeclineButtonView = ({ onClick, dialog }: DeclineButtonViewProps) => {
  return (
    <>
      <Button variant="secondary" size="sm" onClick={onClick} aria-label="Decline invitation">
        Decline
      </Button>
      {dialog}
    </>
  )
}
