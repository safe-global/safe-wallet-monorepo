import type SafeProBanner from './components/SafeProBanner'
import type SafeProWorkspacesBanner from './components/SafeProWorkspacesBanner'

export interface SafeProContract {
  SafeProBanner: typeof SafeProBanner
  SafeProWorkspacesBanner: typeof SafeProWorkspacesBanner
}
