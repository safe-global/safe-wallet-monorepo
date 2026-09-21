import type { ReactElement } from 'react'
import { DrawerFooter } from '@/components/common/Drawer'
import { Button } from '@/components/ui/button'

export type PolicyActionsProps = {
  /** What the drawer's primary action does here — it reads differently per policy status. */
  actionLabel: string
  onClick: () => void
}

/** The drawer's footer action for one policy status. */
const PolicyActions = ({ actionLabel, onClick }: PolicyActionsProps): ReactElement => (
  <DrawerFooter>
    <Button className="w-full" onClick={onClick}>
      {actionLabel}
    </Button>
  </DrawerFooter>
)

export default PolicyActions
