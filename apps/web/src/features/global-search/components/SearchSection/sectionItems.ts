import { Accounts } from './sections/Accounts'
import { NavigateTo } from './sections/NavigateTo'

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
    renderItem: NavigateTo,
  },
  {
    label: 'Accounts',
    activate: () => {
      console.log('Accounts')
    },
    renderItem: Accounts,
  },
]
