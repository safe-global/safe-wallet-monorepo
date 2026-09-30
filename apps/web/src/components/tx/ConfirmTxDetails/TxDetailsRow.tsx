import type { ReactNode } from 'react'
import isString from 'lodash/isString'
import isNumber from 'lodash/isNumber'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { gridFieldClass } from '../FieldsGrid'

const TxDetailsRow = ({ label, children, grid = false }: { label: string; children: ReactNode; grid?: boolean }) => (
  <div className={cn('flex flex-row flex-wrap items-center gap-2', grid ? 'justify-start' : 'justify-between')}>
    <Typography
      variant="paragraph-small"
      className={cn(
        grid ? `text-[var(--color-primary-light)] ${gridFieldClass}` : 'text-[var(--color-text-secondary)]',
      )}
    >
      {label}
    </Typography>

    {isString(children) || isNumber(children) ? (
      <Typography variant="paragraph-small">{children}</Typography>
    ) : (
      children
    )}
  </div>
)

export default TxDetailsRow
