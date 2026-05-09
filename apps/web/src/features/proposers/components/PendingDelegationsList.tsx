import type { ReactElement } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Divider, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PendingDelegation from './PendingDelegation'
import DelegationErrorBoundary from './DelegationErrorBoundary'
import { usePendingDelegations } from '@/features/proposers/hooks/usePendingDelegations'

function PendingDelegationsList(): ReactElement | null {
  const { pendingDelegations, isLoading, refetch } = usePendingDelegations()

  if (isLoading || pendingDelegations.length === 0) return null

  return (
    <Box mb={2}>
      <DelegationErrorBoundary fallbackMessage="Failed to load pending delegations." onRetry={refetch}>
        <Accordion
          defaultExpanded
          disableGutters
          elevation={0}
          sx={{
            '&.MuiAccordion-root': {
              border: '1px solid var(--color-border-light)',
              borderRadius: '6px',
              backgroundColor: 'var(--color-background-paper) !important',
            },
            '& .MuiAccordionSummary-root': {
              backgroundColor: 'var(--color-background-paper) !important',
            },
            '& .MuiAccordionDetails-root': {
              backgroundColor: 'var(--color-background-paper) !important',
            },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                Pending confirmations
              </Typography>
              <Chip
                label={pendingDelegations.length > 19 ? '19+' : pendingDelegations.length}
                size="small"
                sx={{
                  bgcolor: 'warning.light',
                  color: 'text.dark',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '1px',
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 0.5,
                  },
                }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 2 }}>
            {pendingDelegations.map((delegation, index) => (
              <Box key={delegation.messageHash}>
                <DelegationErrorBoundary fallbackMessage="Failed to load this delegation.">
                  <PendingDelegation delegation={delegation} onRefetch={refetch} />
                </DelegationErrorBoundary>
                {index < pendingDelegations.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      </DelegationErrorBoundary>
    </Box>
  )
}

export default PendingDelegationsList
