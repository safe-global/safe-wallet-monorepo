import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMemo } from 'react'
import type { ReactElement, ReactNode } from 'react'
import EnhancedTable from '@/components/common/EnhancedTable'
import EditOwnerIcon from '@/public/images/common/edit-owner.svg'
import ExportIcon from '@/public/images/common/export.svg'
import Track from '@/components/common/Track'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import ReplaceOwnerIcon from '@/public/images/settings/setup/replace-owner.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'

export type OwnerItem = {
  address: string
  ownerInfo: ReactNode
  editDialog: ReactNode
  onReplace: () => void
  onRemove: () => void
}

export type OwnerListViewProps = {
  items: OwnerItem[]
  showRemoveOwnerButton: boolean
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  onManageSigners: () => void
  onExport: () => void
}

export const OwnerListView = ({
  items,
  showRemoveOwnerButton,
  renderCheckWallet,
  onManageSigners,
  onExport,
}: OwnerListViewProps) => {
  const rows = useMemo(() => {
    return items.map(({ address, ownerInfo, editDialog, onReplace, onRemove }) => {
      return {
        key: address,
        cells: {
          owner: {
            rawValue: address,
            content: ownerInfo,
          },
          actions: {
            rawValue: '',
            content: (
              <div className={tableCss.actions}>
                {renderCheckWallet((isOk) => (
                  <Track {...SETTINGS_EVENTS.SETUP.REPLACE_OWNER}>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span>
                            <Button variant="ghost" size="icon-sm" onClick={onReplace} disabled={!isOk}>
                              <ReplaceOwnerIcon className="size-4 text-muted-foreground" />
                            </Button>
                          </span>
                        }
                      />
                      {isOk && <TooltipContent>Replace signer</TooltipContent>}
                    </Tooltip>
                  </Track>
                ))}

                {editDialog}

                {showRemoveOwnerButton &&
                  renderCheckWallet((isOk) => (
                    <Track {...SETTINGS_EVENTS.SETUP.REMOVE_OWNER}>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span>
                              <Button variant="ghost" size="icon-sm" onClick={onRemove} disabled={!isOk}>
                                <DeleteIcon className="size-4 text-destructive" />
                              </Button>
                            </span>
                          }
                        />
                        {isOk && <TooltipContent>Remove signer</TooltipContent>}
                      </Tooltip>
                    </Track>
                  ))}
              </div>
            ),
          },
        },
      }
    })
  }, [items, showRemoveOwnerButton, renderCheckWallet])

  return (
    <div className="flex flex-col gap-4">
      <div data-testid="signer-list">
        <Typography variant="paragraph-bold" className="mb-4">
          Signers
        </Typography>
        <Typography className="mb-4">
          Signers have full control over the account, they can propose, sign and execute transactions, as well as reject
          them.
        </Typography>

        <div className="flex flex-wrap justify-between gap-3 py-4">
          {renderCheckWallet((isOk) => (
            <Track {...SETTINGS_EVENTS.SETUP.MANAGE_SIGNERS}>
              <Button data-testid="manage-signers-btn" onClick={onManageSigners} variant="outline" disabled={!isOk}>
                <EditOwnerIcon className="size-4" />
                Manage signers
              </Button>
            </Track>
          ))}

          <Button variant="outline" onClick={onExport}>
            <ExportIcon className="size-4" />
            Export as CSV
          </Button>
        </div>

        <EnhancedTable rows={rows} headCells={[]} />
      </div>
    </div>
  )
}
