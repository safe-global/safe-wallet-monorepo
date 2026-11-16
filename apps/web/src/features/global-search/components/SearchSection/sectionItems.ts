import type { ComponentType } from 'react'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import AccountsSection from './sections/Accounts/AccountsSection'
import NavigateToSection from './sections/NavigateTo/NavigateToSection'
import TrustedSafesSection from './sections/TrustedSafes/TrustedSafesSection'
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
