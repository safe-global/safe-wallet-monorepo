import type { ReactNode } from 'react'
import CheckIcon from '@/public/images/messages/signed.svg'
import PlusIcon from '@/public/images/messages/created.svg'
import css from './styles.module.css'

export type StepItem = {
  id: string
  label: ReactNode
  done: boolean
}

export const Steps = ({ items }: { items: StepItem[] }) => (
  <ol className={css.steps}>
    {items.map(({ id, label, done }) => (
      <li key={id} data-testid={`step-${id}`} data-state={done ? 'done' : 'todo'} className={css.step}>
        {label}
        <span className={css.icon}>{done ? <CheckIcon /> : <PlusIcon />}</span>
      </li>
    ))}
  </ol>
)
