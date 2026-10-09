import type { ReactElement, ReactNode } from 'react'
import css from './index.module.css'

const MarkdownContent = ({ children }: { children: ReactNode }): ReactElement => (
  <div className={css.markdown}>{children}</div>
)

export default MarkdownContent
