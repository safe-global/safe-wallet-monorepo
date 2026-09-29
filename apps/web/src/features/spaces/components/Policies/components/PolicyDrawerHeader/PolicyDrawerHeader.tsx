import type { ReactElement, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { DrawerHeader, DrawerTitle } from '@/components/common/Drawer'

export type PolicyDrawerHeaderProps = {
  icon: LucideIcon
  title: string
  /** The right-hand slot: a status chip, a badge, or a skeleton while the status loads. */
  children?: ReactNode
}

const PolicyDrawerHeader = ({ icon: Icon, title, children }: PolicyDrawerHeaderProps): ReactElement => (
  <DrawerHeader>
    <div className="flex size-10 items-center justify-center rounded-lg bg-success-subtle">
      <Icon className="size-4 text-success-strong" />
    </div>
    <DrawerTitle size="lg">{title}</DrawerTitle>
    {children && <div className="ml-auto">{children}</div>}
  </DrawerHeader>
)

export default PolicyDrawerHeader
