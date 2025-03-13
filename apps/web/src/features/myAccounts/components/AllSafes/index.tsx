import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import SafesList from '@/features/myAccounts/components/SafesList'
import type { AllSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import css from '@/features/myAccounts/styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import { useRouter } from 'next/router'

const AllSafes = ({
  allSafes,
  onLinkClick,
  isSidebar,
}: {
  allSafes: AllSafeItems
  onLinkClick?: () => void
  isSidebar: boolean
}) => {
  const wallet = useWallet()
  const router = useRouter()

  const isLoginPage = router.pathname === AppRoutes.welcome.accounts
  const trackingLabel = isLoginPage ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  return (
    <Accordion sx={{ border: 'none' }} defaultExpanded={!isSidebar} slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary
        data-testid="expand-safes-list"
        expandIcon={<ExpandMoreIcon sx={{ '& path': { fill: 'var(--color-text-secondary)' } }} />}
        sx={{
          padding: 0,
          '& .MuiAccordionSummary-content': { margin: '0 !important', mb: 1, flexGrow: 0 },
        }}
        component="div"
      >
        <div className={css.listHeader}>
          <Typography variant="h5" fontWeight={700}>
            Accounts
            {allSafes && allSafes.length > 0 && (
              <Typography component="span" color="text.secondary" fontSize="inherit" fontWeight="normal" mr={1}>
                {' '}
                ({allSafes.length})
              </Typography>
            )}
          </Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails data-testid="accounts-list" sx={{ padding: 0 }}>
        {allSafes.length > 0 ? (
          <Box mt={1}>
            <SafesList safes={allSafes} onLinkClick={onLinkClick} />
          </Box>
        ) : (
          <Typography
            data-testid="empty-account-list"
            component="div"
            variant="body2"
            color="text.secondary"
            textAlign="center"
            py={3}
            mx="auto"
            width={250}
          >
            {!wallet ? (
              <>
                <Box mb={2}>Connect a wallet to view your Safe Accounts or to create a new one</Box>
                <Track {...OVERVIEW_EVENTS.OPEN_ONBOARD} label={trackingLabel}>
                  <ConnectWalletButton text="Connect a wallet" contained />
                </Track>
              </>
            ) : (
              "You don't have any safes yet"
            )}
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

export default AllSafes
