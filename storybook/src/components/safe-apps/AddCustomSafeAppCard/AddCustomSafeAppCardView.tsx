import type { ReactElement, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AddCustomAppIcon from '@/public/images/apps/add-custom-app.svg'

export type AddCustomSafeAppCardViewProps = {
  onOpenModal: () => void
  modal: ReactNode
}

export function AddCustomSafeAppCardView({ onOpenModal, modal }: AddCustomSafeAppCardViewProps): ReactElement {
  return (
    <>
      <Card size="none">
        <div className="flex flex-col items-center px-3 py-12">
          {/* Add Custom Safe App Icon */}
          <AddCustomAppIcon alt="Add Custom Safe App card" />

          {/*  Add Custom Safe App Button */}
          <Button size="sm" onClick={onOpenModal} className="mt-6">
            Add custom Safe App
          </Button>
        </div>
      </Card>

      {modal}
    </>
  )
}
