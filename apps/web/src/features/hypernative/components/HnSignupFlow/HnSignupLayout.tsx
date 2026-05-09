import { Grid2 } from '@mui/material'
import type { ReactNode } from 'react'
import css from './styles.module.css'

export type HnSignupLayoutProps = {
  children: ReactNode
  contentClassName: string
}

const HnSignupLayout = ({ children, contentClassName }: HnSignupLayoutProps) => {
  return (
    <Grid2 container className={css.container}>
      {/* Left Column - Content */}
      <Grid2 size="grow" className={contentClassName}>
        {children}
      </Grid2>

      {/* Right Column - Background Image */}
      <Grid2 className={css.backgroundColumn} />
    </Grid2>
  )
}

export default HnSignupLayout
