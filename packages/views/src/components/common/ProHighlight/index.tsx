import type { ReactNode } from 'react'
import css from './ProHighlight.module.css'

/** The brand-green underline the Safe Pro copy wears behind "Safe Pro" (and other highlighted words). */
export const ProHighlight = ({ children }: { children: ReactNode }) => <span className={css.highlight}>{children}</span>

export { highlightSafePro } from './highlightSafePro'
