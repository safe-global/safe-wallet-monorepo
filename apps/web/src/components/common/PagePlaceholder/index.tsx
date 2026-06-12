import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

type PagePlaceholderProps = {
  img: ReactNode
  text: ReactNode
  children?: ReactNode
}

const PagePlaceholder = ({ img, text, children }: PagePlaceholderProps): ReactElement => {
  return (
    <div className={css.container}>
      {img}

      {typeof text === 'string' ? (
        <Typography className="mt-4 text-[var(--color-primary-light)]">{text}</Typography>
      ) : (
        text
      )}

      {children}
    </div>
  )
}

export default PagePlaceholder
