import { Button } from '@/components/ui/button'
import { ADMIN_ONLY_RENAME_MESSAGE } from '@/utils/addressBookNotifications'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMemo } from 'react'
import type { ReactElement, ReactNode } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import EditIcon from '@/public/images/common/edit.svg'
import EnhancedTable from '@/components/common/EnhancedTable'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import SettingsCard from '@/components/settings/SettingsCard'

export type RenameNestedSafeButtonViewProps = {
  isOk: boolean
  canRename: boolean
  onRename: () => void
}

export function RenameNestedSafeButtonView({
  isOk,
  canRename,
  onRename,
}: RenameNestedSafeButtonViewProps): ReactElement {
  const disabled = !isOk || !canRename

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span>
            <Button
              data-testid="rename-nested-safe-btn"
              variant="ghost"
              size="icon-sm"
              onClick={onRename}
              disabled={disabled}
            >
              <EditIcon className="size-4 text-muted-foreground" />
            </Button>
          </span>
        }
      />
      {!canRename ? (
        <TooltipContent>{ADMIN_ONLY_RENAME_MESSAGE}</TooltipContent>
      ) : (
        isOk && <TooltipContent>Rename nested Safe</TooltipContent>
      )}
    </Tooltip>
  )
}

export type NestedSafeItem = {
  address: string
  owner: ReactNode
  renameAction: ReactNode
}

export type NestedSafesListViewProps = {
  items: NestedSafeItem[]
  isDeployed: boolean
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  onAddNestedSafe: () => void
  entryDialog?: ReactNode
}

export function NestedSafesListView({
  items,
  isDeployed,
  renderCheckWallet,
  onAddNestedSafe,
  entryDialog,
}: NestedSafesListViewProps): ReactElement {
  const rows = useMemo(
    () =>
      items.map((item) => ({
        cells: {
          owner: {
            rawValue: item.address,
            content: item.owner,
          },
          actions: {
            rawValue: '',
            content: <div className={tableCss.actions}>{item.renameAction}</div>,
          },
        },
      })),
    [items],
  )

  return (
    <>
      <SettingsCard title="Nested Safes" className="mt-4">
        <Typography className="mb-6">
          Nested Safes are separate wallets owned by your main Account, perfect for organizing different funds and
          projects.
        </Typography>

        {rows.length === 0 && (
          <Typography className="mb-6">
            You don&apos;t have any Nested Safes yet. Set one up now to better organize your assets
          </Typography>
        )}

        {isDeployed &&
          renderCheckWallet((isOk) => (
            <Button variant="ghost" size="lg" onClick={onAddNestedSafe} disabled={!isOk} className="mb-6">
              <AddIcon className="size-4" />
              Add nested Safe
            </Button>
          ))}

        {rows && rows.length > 0 && <EnhancedTable rows={rows} headCells={[]} />}
      </SettingsCard>

      {entryDialog}
    </>
  )
}
