import { useRouter } from 'next/router'
import { AccountsSection } from './sections/Accounts'
import { NavigateToSection } from './sections/NavigateTo'
import { TrustedSafesSection } from './sections/TrustedSafes'

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

const useHasSpaceQuery = () => {
  const { query } = useRouter()

  return !!query.spaceId
}

const useNotInSpace = () => {
  const { query } = useRouter()

  const spaceId = query.spaceId

  return !spaceId
}

export const sectionItems: SectionItem[] = [
  {
    label: 'Navigate to',
    useActivate: useAlwaysActive,
    renderItem: NavigateToSection,
  },
  {
    label: 'Safe accounts',
    useActivate: useHasSpaceQuery,
    renderItem: AccountsSection,
  },
  {
    label: 'Trusted safes',
    useActivate: useNotInSpace,
    renderItem: TrustedSafesSection,
  },
]
