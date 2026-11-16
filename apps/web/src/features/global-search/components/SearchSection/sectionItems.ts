import type { ComponentType } from 'react'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import AccountsSection from '@/features/global-search/components/SearchSection/sections/Accounts/AccountsSection'
import NavigateToSection from '@/features/global-search/components/SearchSection/sections/NavigateTo/NavigateToSection'
import TrustedSafesSection from '@/features/global-search/components/SearchSection/sections/TrustedSafes/TrustedSafesSection'
import useIsQualifiedSafe from '@/features/spaces/hooks/useIsQualifiedSafe'

export interface SectionItemProps {
  query: string
  label: string
}

export interface SectionItem {
  label: string
  useActivate: () => boolean
  Component: ComponentType<SectionItemProps>
}

const useAlwaysActive = () => true

const useIsInSpace = () => {
  const isSpaceRoute = useIsSpaceRoute()
  const qualifiedSafe = useIsQualifiedSafe()

  return qualifiedSafe || isSpaceRoute
}

const useNotInSpace = () => {
  const qualifiedSafe = useIsQualifiedSafe()
  return !qualifiedSafe
}

export const sectionItems: SectionItem[] = [
  {
    label: 'Navigate to',
    useActivate: useAlwaysActive,
    Component: NavigateToSection,
  },
  {
    label: 'Safe accounts',
    useActivate: useIsInSpace,
    Component: AccountsSection,
  },
  {
    label: 'My accounts',
    useActivate: useNotInSpace,
    Component: TrustedSafesSection,
  },
]
