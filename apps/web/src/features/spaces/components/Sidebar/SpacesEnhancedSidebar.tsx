import type { ReactElement } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { EnhancedSidebar } from './index'

export const SpacesEnhancedSidebar = (): ReactElement => (
  <SidebarProvider>
    <EnhancedSidebar type="spaces" spaceName="" spaceInitial="" />
  </SidebarProvider>
)
