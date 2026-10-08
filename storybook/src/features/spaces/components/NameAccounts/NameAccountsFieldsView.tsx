import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import Identicon from '@/components/common/Identicon'
import FullAddress from '@views/components/common/AccountRow/FullAddress'
import RenameButton from '@views/components/common/AccountRow/RenameButton'
import { HOVER_ACTION_CLASS } from '@views/components/common/AccountRow/utils'
import { cn } from '@/utils/cn'

export type NameAccountInputSlotProps = {
  placeholder: string
  className: string
  InputProps: { className: string }
  'data-testid': string
}

export type NameAccountCellViewProps = {
  address: string
  value: string
  showInput: boolean
  error?: string
  onFocus: () => void
  onBlur: () => void
  onStartEditing: () => void
  renderNameInput: (props: NameAccountInputSlotProps) => ReactNode
}

export const NameAccountCellView = ({
  address,
  value,
  showInput,
  error,
  onFocus,
  onBlur,
  onStartEditing,
  renderNameInput,
}: NameAccountCellViewProps) => {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex w-10 shrink-0 items-center">
        <Identicon address={address} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5" onFocus={onFocus} onBlur={onBlur}>
        {showInput ? (
          renderNameInput({
            placeholder: 'Add a name',
            className: '-mx-1.5 w-[calc(100%+0.75rem)] [&_[data-slot=field-error]]:hidden',
            InputProps: {
              className: cn(
                'h-6 w-0 min-w-full rounded-sm px-1.5 py-0 text-base font-semibold md:text-base',
                error && 'border-destructive',
              ),
            },
            'data-testid': 'account-name-input',
          })
        ) : (
          <div className="flex h-6 items-center gap-1">
            <button
              type="button"
              onClick={onStartEditing}
              className="-mx-2 min-w-0 cursor-text truncate rounded-sm px-2 text-left text-base leading-6 font-semibold group-hover/row:bg-muted"
              data-testid="account-name-text"
            >
              {value}
            </button>
            <RenameButton onRename={onStartEditing} className={HOVER_ACTION_CLASS} />
          </div>
        )}
        {error ? (
          <Typography variant="paragraph-mini" className="text-destructive" role="alert">
            {error}
          </Typography>
        ) : (
          <FullAddress address={address} />
        )}
      </div>
    </div>
  )
}

export type NameAccountsFieldsViewProps = {
  table: ReactNode
}

/** Naming step shared by workspace onboarding and the "Add accounts" dialog. */
export const NameAccountsFieldsView = ({ table }: NameAccountsFieldsViewProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Typography variant="paragraph" color="muted">
        Everyone on the Workspace can see these names. It is stored in the Workspace address book.
      </Typography>

      {table}
    </div>
  )
}
