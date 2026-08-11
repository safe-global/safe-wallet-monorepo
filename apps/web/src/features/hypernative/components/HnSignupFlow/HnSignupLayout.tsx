import type { ReactNode } from 'react'
import css from './styles.module.css'

export type HnSignupLayoutProps = {
  children: ReactNode
  contentClassName: string
}

const HnSignupLayout = ({ children, contentClassName }: HnSignupLayoutProps) => {
  return (
    <div className={`flex ${css.container}`}>
      {/* Left Column - Content */}
      <div className={`grow ${contentClassName}`}>{children}</div>

      {/* Right Column - Background Image */}
      <div className={css.backgroundColumn} />
    </div>
  )
}

export default HnSignupLayout
