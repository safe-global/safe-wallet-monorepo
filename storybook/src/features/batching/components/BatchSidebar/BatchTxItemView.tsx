import type { ReactNode, SyntheticEvent } from 'react'
import { ListItem } from '@/components/ui/list'
import { Skeleton } from '@/components/ui/skeleton'
import css from './styles.module.css'

import DeleteIcon from '@/public/images/common/delete.svg'

export type BatchTxItemViewProps = {
  count: number
  isDecoded: boolean
  canDelete: boolean
  onDelete: (e: SyntheticEvent) => void
  renderDecoded: (props: { actionTitle: string; actions: ReactNode }) => ReactNode
}

export const BatchTxItemView = ({ count, isDecoded, canDelete, onDelete, renderDecoded }: BatchTxItemViewProps) => {
  return (
    <ListItem className="items-start gap-4 py-0">
      <div className={css.number}>{count}</div>
      {isDecoded ? (
        <div className={css.accordion}>
          {renderDecoded({
            actionTitle: '',
            actions: canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                title="Delete transaction"
                className="inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0.5"
              >
                <DeleteIcon className="size-4" />
              </button>
            ) : undefined,
          })}
        </div>
      ) : (
        <Skeleton className="h-[56px] w-full" />
      )}
    </ListItem>
  )
}
