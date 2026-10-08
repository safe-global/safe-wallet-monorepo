import type { MouseEventHandler, ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import Rocket from '@/public/images/common/rocket.svg'

export type SpeedUpMonitorViewProps = {
  modalTrigger: 'alertBox' | 'alertButton'
  onOpen: MouseEventHandler
  modal: ReactNode
}

export const SpeedUpMonitorView = ({ modalTrigger, onOpen, modal }: SpeedUpMonitorViewProps) => {
  return (
    <div>
      {modal}
      {modalTrigger === 'alertBox' ? (
        <Alert variant="warning" outlined={false}>
          <Rocket className="size-4" />
          <AlertTitle>
            <Typography align="left">Taking too long?</Typography>
          </AlertTitle>
          <AlertDescription>Try to speed up with better gas parameters.</AlertDescription>
          <AlertAction className="top-1/2">
            <Button variant="outline" className="text-foreground" onClick={onOpen}>{`Speed up >`}</Button>
          </AlertAction>
        </Alert>
      ) : (
        <Button variant="outline" size="sm" onClick={onOpen}>
          Speed up
        </Button>
      )}
    </div>
  )
}
