import { AccountsSection } from './sections/Accounts'
import { NavigateToSection } from './sections/NavigateTo'

interface SectionItem {
  label: string
  activate: () => void
  renderItem: () => React.ReactNode
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
]
