import type { ReactElement, ReactNode } from 'react'
import classNames from 'classnames'
import { DataRow as TxDataRow } from '@/components/common/Table/DataRow'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

export type DecodedParamRow = {
  key: string
  title: string
  isNested: boolean
  valueAsString: string
  value: ReactNode
}

export type DecodedTypedObjectViewProps = {
  displayedType: string
  rows: DecodedParamRow[]
}

export function DecodedTypedObjectView({ displayedType, rows }: DecodedTypedObjectViewProps): ReactElement {
  return (
    <div>
      <Typography variant="paragraph-mini-bold" className="uppercase text-[var(--color-border-main)]">
        {displayedType}
      </Typography>

      {rows.map((row) => (
        <TxDataRow key={row.key} title={row.title}>
          {row.isNested ? <div className={classNames(css.nestedMsg, 'rounded')}>{row.valueAsString}</div> : row.value}
        </TxDataRow>
      ))}
    </div>
  )
}

export type ErrorBoundarySlotProps = {
  fallback: ReactNode
  children: ReactNode
}

export type DecodedMsgViewProps = {
  isInModal: boolean
  renderErrorBoundary: (props: ErrorBoundarySlotProps) => ReactNode
  domainObject: ReactNode
  primaryObject: ReactNode
}

export function DecodedMsgView({
  isInModal,
  renderErrorBoundary,
  domainObject,
  primaryObject,
}: DecodedMsgViewProps): ReactElement {
  return (
    <div className={classNames(css.container, 'rounded', { [css.scrollable]: isInModal })}>
      {renderErrorBoundary({
        fallback: <div>Error decoding message</div>,
        children: (
          <>
            {domainObject}
            {primaryObject}
          </>
        ),
      })}
    </div>
  )
}
