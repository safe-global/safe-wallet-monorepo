import EnhancedTable from '@/components/common/EnhancedTable'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import {
  UpsertProposer,
  DeleteProposerDialog,
  EditProposerDialog,
  PendingDelegationsList,
  useParentSafeThreshold,
} from '@/features/proposers'
import { useHasFeature } from '@/hooks/useChains'
import useProposers from '@/hooks/useProposers'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import AddIcon from '@/public/images/common/add.svg'
import { SETTINGS_EVENTS } from '@/services/analytics'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import EthHashInfo from '@/components/common/EthHashInfo'
import ExternalLink from '@/components/common/ExternalLink'
import { useMemo, useState } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import SettingsCard from '@/components/settings/SettingsCard'

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

const AddProposerButton = ({ onAdd, isUndeployedSafe }: { onAdd: () => void; isUndeployedSafe: boolean }) => (
  <div className="mb-4">
    <CheckWallet allowProposer={false}>
      {(isOk) => (
        <Track {...SETTINGS_EVENTS.PROPOSERS.ADD_PROPOSER}>
          <Tooltip>
            <TooltipTrigger
              render={
                <span>
                  <Button
                    data-testid="add-proposer-btn"
                    onClick={onAdd}
                    variant="ghost"
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
      )}
    </CheckWallet>
  </div>
)

const ProposersList = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>()
  const proposers = useProposers()
  const isEnabled = useHasFeature(FEATURES.PROPOSERS)
  const { safe } = useSafeInfo()
  const isUndeployedSafe = !safe.deployed
  const isNestedSafeOwner = useIsNestedSafeOwner()
  const nestedSafeOwners = useNestedSafeOwners()
  const { threshold: parentThreshold } = useParentSafeThreshold(nestedSafeOwners?.[0])
  const showPendingDelegations = isNestedSafeOwner && parentThreshold !== undefined && parentThreshold > 1

  const rows = useMemo(() => {
    if (!proposers.data) return []

    return proposers.data.results.map((proposer) => {
      return {
        cells: {
          proposer: {
            rawValue: proposer.delegate,
            content: (
              <NamedAddressInfo
                address={proposer.delegate}
                showCopyButton
                hasExplorer
                name={proposer.label || undefined}
                shortAddress
              />
            ),
          },

          creator: {
            rawValue: proposer.delegator,
            content: <EthHashInfo address={proposer.delegator} showCopyButton hasExplorer shortAddress />,
          },
          actions: {
            rawValue: '',
            sticky: true,
            content: isEnabled && (
              <div className={tableCss.actions}>
                <EditProposerDialog proposer={proposer} />
                <DeleteProposerDialog proposer={proposer} />
              </div>
            ),
          },
        },
      }
    })
  }, [isEnabled, proposers.data])

  if (!proposers.data?.results) return null

  const onAdd = () => {
    setIsAddDialogOpen(true)
  }

  return (
    <SettingsCard
      title="Proposers"
      className="mt-4"
      contentClassName="flex flex-col gap-4"
      data-testid="proposer-section"
    >
      <div>
        <Typography className="mb-4">
          Proposers can suggest transactions but cannot approve or execute them. Signers should review and approve
          transactions first. <ExternalLink href={HelpCenterArticle.PROPOSERS}>Learn more</ExternalLink>
        </Typography>

        {showPendingDelegations && <PendingDelegationsList />}

        {isEnabled && <AddProposerButton onAdd={onAdd} isUndeployedSafe={isUndeployedSafe} />}

        {rows.length > 0 && <EnhancedTable rows={rows} headCells={headCells} />}
      </div>

      {isAddDialogOpen && (
        <UpsertProposer onClose={() => setIsAddDialogOpen(false)} onSuccess={() => setIsAddDialogOpen(false)} />
      )}
    </SettingsCard>
  )
}

export default ProposersList
