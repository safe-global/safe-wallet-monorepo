import EnhancedTable from '@/components/common/EnhancedTable'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import Track from '@/components/common/Track'
import AddIcon from '@/public/images/common/add.svg'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ExternalLink from '@/components/common/ExternalLink'
import { useMemo } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const headCells = [
  {
    id: 'proposer',
    label: 'Proposer',
  },
  {
    id: 'creator',
    label: 'Creator',
  },
  {
    id: 'Actions',
    label: '',
  },
]
const SafeNotActivated = 'You need to activate the Safe before transacting'

type CheckWalletRender = (render: (isOk: boolean) => ReactElement) => ReactNode

const AddProposerButton = ({
  onAdd,
  isUndeployedSafe,
  renderCheckWallet,
}: {
  onAdd: () => void
  isUndeployedSafe: boolean
  renderCheckWallet: CheckWalletRender
}) => (
  <div className="mb-4">
    {renderCheckWallet((isOk) => (
      <Track {...SETTINGS_EVENTS.PROPOSERS.ADD_PROPOSER}>
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <Button
                  data-testid="add-proposer-btn"
                  variant="ghost"
                  size="lg"
                  onClick={onAdd}
                  disabled={!isOk || isUndeployedSafe}
                >
                  <AddIcon className="size-4" />
                  Add proposer
                </Button>
              </span>
            }
          />
          {isUndeployedSafe && <TooltipContent>{SafeNotActivated}</TooltipContent>}
        </Tooltip>
      </Track>
    ))}
  </div>
)

export type ProposerItem = {
  delegate: string
  delegator: string
  proposer: ReactNode
  creator: ReactNode
  actions: ReactNode
}

export type ProposersListViewProps = {
  items: ProposerItem[]
  isEnabled: boolean
  mustUpgradeToSafePro: boolean
  isPlanLoading: boolean
  isUndeployedSafe: boolean
  showPendingDelegations: boolean | null
  pendingDelegations: ReactNode
  renderSafeProLock: (props: { title: string }) => ReactNode
  renderCheckWallet: CheckWalletRender
  onAdd: () => void
  addDialog?: ReactNode
}

export const ProposersListView = ({
  items,
  isEnabled,
  mustUpgradeToSafePro,
  isPlanLoading,
  isUndeployedSafe,
  showPendingDelegations,
  pendingDelegations,
  renderSafeProLock,
  renderCheckWallet,
  onAdd,
  addDialog,
}: ProposersListViewProps) => {
  const rows = useMemo(
    () =>
      items.map((item) => ({
        cells: {
          proposer: {
            rawValue: item.delegate,
            content: item.proposer,
          },

          creator: {
            rawValue: item.delegator,
            content: item.creator,
          },
          actions: {
            rawValue: '',
            content: isEnabled && <div className={tableCss.actions}>{item.actions}</div>,
          },
        },
      })),
    [isEnabled, items],
  )

  return (
    <div data-testid="proposer-section">
      <Typography variant="paragraph-bold" className="mb-4">
        Proposers
      </Typography>
      <Typography className="mb-4">
        Proposers can suggest transactions but cannot approve or execute them. Signers should review and approve
        transactions first.{' '}
        <ExternalLink className="font-bold hover:text-muted-foreground" href={HelpCenterArticle.PROPOSERS}>
          Learn more
        </ExternalLink>
      </Typography>

      {showPendingDelegations && pendingDelegations}

      {isEnabled &&
        (mustUpgradeToSafePro ? (
          <div className="mb-4">{renderSafeProLock({ title: 'Adding proposers requires Safe Pro' })}</div>
        ) : (
          !isPlanLoading && (
            <AddProposerButton
              onAdd={onAdd}
              isUndeployedSafe={isUndeployedSafe}
              renderCheckWallet={renderCheckWallet}
            />
          )
        ))}

      {rows.length > 0 && <EnhancedTable rows={rows} headCells={headCells} />}

      {addDialog}
    </div>
  )
}
