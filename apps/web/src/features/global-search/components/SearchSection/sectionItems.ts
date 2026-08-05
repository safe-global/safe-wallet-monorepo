import type { ComponentType } from 'react'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { AccountsSection } from './sections/Accounts'
import { NavigateToSection } from './sections/NavigateTo'
import { TrustedSafesSection } from './sections/TrustedSafes'
import { useIsQualifiedSafe } from '@/features/spaces'

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
