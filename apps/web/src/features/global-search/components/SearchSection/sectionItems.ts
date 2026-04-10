import { AccountsSection } from './sections/Accounts'
import { NavigateToSection } from './sections/NavigateTo'
import { TrustedSafesSection } from './sections/TrustedSafes'

export interface SectionItemProps {
  query: string
}

interface SectionItem {
  label: string
  activate: () => void
  renderItem: (props: SectionItemProps) => React.ReactNode
}

export const sectionItems: SectionItem[] = [
  {
    label: 'Navigate to',
    activate: () => {
      console.log('Navigate to')
    },
    renderItem: NavigateToSection,
  },
  {
    label: 'Accounts',
    activate: () => {
      console.log('Accounts')
    },
    renderItem: AccountsSection,
  },
  {
    label: 'Trusted safes',
    activate: () => {
      console.log('Trusted safes')
    },
    renderItem: TrustedSafesSection,
  },
]
