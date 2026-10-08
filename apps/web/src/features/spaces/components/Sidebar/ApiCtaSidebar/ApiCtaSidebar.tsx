import type { ReactElement } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { ApiCtaSidebarView } from '@views/features/spaces/components/Sidebar/ApiCtaSidebar/ApiCtaSidebarView'

const API_DOCS_URL = process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL || 'https://developer.safe.global/login'
const COLLAPSED_KEY = 'api-cta-sidebar-collapsed'

export const ApiCtaSidebar = (): ReactElement => {
  const [isCollapsed = true, setIsCollapsed] = useLocalStorage<boolean>(COLLAPSED_KEY)

  return <ApiCtaSidebarView apiDocsUrl={API_DOCS_URL} isCollapsed={isCollapsed} onCollapsedChange={setIsCollapsed} />
}
