import type { ReactElement } from 'react'
import { SidebarTopBar } from '../SidebarTopBar'
import { SidebarSkeletonView } from '@views/features/spaces/components/Sidebar/SidebarSkeleton/SidebarSkeletonView'

export { Pulse } from '@views/features/spaces/components/Sidebar/SidebarSkeleton/SidebarSkeletonView'

export const SidebarSkeleton = ({ contained = false }: { contained?: boolean }): ReactElement => (
  <SidebarSkeletonView contained={contained} topBar={<SidebarTopBar />} />
)
