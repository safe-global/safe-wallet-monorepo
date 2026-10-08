import type { ReactNode } from 'react'

export type SafesListViewProps = {
  items: Array<{ key: string; content: ReactNode }>
}

export const SafesListView = ({ items }: SafesListViewProps) => {
  return items.map((item) => <div key={item.key}>{item.content}</div>)
}
