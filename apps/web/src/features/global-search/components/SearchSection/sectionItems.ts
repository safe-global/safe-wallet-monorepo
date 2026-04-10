import { AccountsSection } from './sections/Accounts'
import { NavigateToSection } from './sections/NavigateTo'
import { TrustedSafesSection } from './sections/TrustedSafes'
import { useCurrentSpaceId } from '@/features/spaces'

export interface SectionItemProps {
  query: string
  label: string
}

export interface SectionItem {
  label: string
  useActivate: () => boolean
  renderItem: (props: SectionItemProps) => React.ReactNode
}

const useAlwaysActive = () => true

const useNotInSpace = () => {
  const spaceId = useCurrentSpaceId()
  return !spaceId
}

export const sectionItems: SectionItem[] = [
  {
    label: 'Navigate to',
    useActivate: useAlwaysActive,
    renderItem: NavigateToSection,
  },
  {
    label: 'Accounts',
    useActivate: useAlwaysActive,
    renderItem: AccountsSection,
  },
  {
    label: 'Trusted safes',
    useActivate: useNotInSpace,
    renderItem: TrustedSafesSection,
  },
]
