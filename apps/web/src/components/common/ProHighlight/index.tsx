import type { ReactNode } from 'react'
import css from './ProHighlight.module.css'

/** The brand-green underline the Safe Pro copy wears behind "Safe Pro" (and other highlighted words). */
export const ProHighlight = ({ children }: { children: ReactNode }) => <span className={css.highlight}>{children}</span>

const SAFE_PRO = 'Safe Pro'

export const highlightSafePro = (text: string): ReactNode => {
  const parts = text.split(SAFE_PRO)
  if (parts.length === 1) return text
  return parts.flatMap((part, index) =>
    index === 0 ? [part] : [<ProHighlight key={index}>{SAFE_PRO}</ProHighlight>, part],
  )
}
