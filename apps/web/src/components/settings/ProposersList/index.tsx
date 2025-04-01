import { Chip } from '@/components/common/Chip'
import EnhancedTable from '@/components/common/EnhancedTable'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import OnlyOwner from '@/components/common/OnlyOwner'
import Track from '@/components/common/Track'
import UpsertProposer from '@/features/proposers/components/UpsertProposer'
import DeleteProposerDialog from '@/features/proposers/components/DeleteProposerDialog'
import EditProposerDialog from '@/features/proposers/components/EditProposerDialog'
import { useHasFeature } from '@/hooks/useChains'
import useProposers from '@/hooks/useProposers'
import AddIcon from '@/public/images/common/add.svg'
import { SETTINGS_EVENTS } from '@/services/analytics'
import { Box, Button, Grid, Paper, SvgIcon, Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@/config/constants'
import React, { useMemo, useState } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'

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

const ProposersList = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>()
  const proposers = useProposers()
  const isEnabled = useHasFeature(FEATURES.PROPOSERS)

  const rows = useMemo(() => {
    if (!proposers.data) return []

    return proposers.data.results.map((proposer) => {
      return {
        cells: {
          proposer: {
            rawValue: proposer.delegate,
            content: (
              <EthHashInfo
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
    <Paper sx={{ mt: 2 }}>
      <Box data-testid="proposer-section" display="flex" flexDirection="column" gap={2}>
        <Grid container spacing={3}>
          <Grid item lg={4} xs={12}>
            <Typography variant="h4" fontWeight={700}></Typography>
          </Grid>

          <Grid item xs>
            <Typography fontWeight="bold" mb={2}>
              Proposers <Chip label="New" sx={{ backgroundColor: 'secondary.light', color: 'static.main' }} />
            </Typography>
            <Typography mb={2}>
              Proposers can suggest transactions but cannot approve or execute them. Signers should review and approve
              transactions first. <ExternalLink href={HelpCenterArticle.PROPOSERS}>Learn more</ExternalLink>
            </Typography>

            {isEnabled && (
              <Box mb={2}>
                <OnlyOwner>
                  {(isOk) => (
                    <Track {...SETTINGS_EVENTS.PROPOSERS.ADD_PROPOSER}>
                      <Button
                        data-testid="add-proposer-btn"
                        onClick={onAdd}
                        variant="text"
                        startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
                        disabled={!isOk}
                        size="compact"
                      >
                        Add proposer
                      </Button>
                    </Track>
                  )}
                </OnlyOwner>
              </Box>
            )}

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
