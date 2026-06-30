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
import { Box, Button, Grid, Paper, SvgIcon, Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import ExternalLink from '@/components/common/ExternalLink'
import React, { useMemo, useState } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Tooltip } from '@mui/material'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { useListSimilarityWarnings } from '@/features/address-poisoning'

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
  <Box mb={2}>
    <CheckWallet allowProposer={false}>
      {(isOk) => (
        <Track {...SETTINGS_EVENTS.PROPOSERS.ADD_PROPOSER}>
          <Tooltip title={isUndeployedSafe ? SafeNotActivated : ''}>
            <span>
              <Button
                data-testid="add-proposer-btn"
                onClick={onAdd}
                variant="text"
                startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
                disabled={!isOk || isUndeployedSafe}
                size="medium"
              >
                Add proposer
              </Button>
            </span>
          </Tooltip>
        </Track>
      )}
    </CheckWallet>
  </Box>
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

  // Mode B: proposers come from the backend, so flag any delegate/delegator that
  // resembles a trusted anchor.
  const similarityAddresses = useMemo(
    () => proposers.data?.results.flatMap((proposer) => [proposer.delegate, proposer.delegator]) ?? [],
    [proposers.data],
  )
  const getSimilarityWarning = useListSimilarityWarnings(similarityAddresses)

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
                similarityWarning={getSimilarityWarning(proposer.delegate)}
              />
            ),
          },

          creator: {
            rawValue: proposer.delegator,
            content: (
              <EthHashInfo
                address={proposer.delegator}
                showCopyButton
                hasExplorer
                shortAddress
                similarityWarning={getSimilarityWarning(proposer.delegator)}
              />
            ),
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
  }, [isEnabled, proposers.data, getSimilarityWarning])

  if (!proposers.data?.results) return null

  const onAdd = () => {
    setIsAddDialogOpen(true)
  }

  return (
    <Paper sx={{ mt: 2 }}>
      <Box data-testid="proposer-section" display="flex" flexDirection="column" gap={2}>
        <Grid container spacing={3}>
          <Grid item xs>
            <Typography fontWeight="bold" mb={2}>
              Proposers
            </Typography>
            <Typography mb={2}>
              Proposers can suggest transactions but cannot approve or execute them. Signers should review and approve
              transactions first. <ExternalLink href={HelpCenterArticle.PROPOSERS}>Learn more</ExternalLink>
            </Typography>

            {showPendingDelegations && <PendingDelegationsList />}

            {isEnabled && <AddProposerButton onAdd={onAdd} isUndeployedSafe={isUndeployedSafe} />}

            {rows.length > 0 && <EnhancedTable rows={rows} headCells={headCells} />}
          </Grid>

          {isAddDialogOpen && (
            <UpsertProposer onClose={() => setIsAddDialogOpen(false)} onSuccess={() => setIsAddDialogOpen(false)} />
          )}
        </Grid>
      </Box>
    </Paper>
  )
}

export default ProposersList
