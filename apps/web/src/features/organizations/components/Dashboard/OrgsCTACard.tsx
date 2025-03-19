import css from '@/features/organizations/components/Dashboard/styles.module.css'
import LightbulbIcon from '@/public/images/common/lightbulb.svg'
import { Typography, Paper, Box, Button, SvgIcon } from '@mui/material'
import OrgsInfoModal from '../OrgsInfoModal'
import { useState } from 'react'
import { ORG_EVENTS, ORG_LABELS } from '@/services/analytics/events/organizations'
import { trackEvent } from '@/services/analytics'

const OrgsCTACard = () => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  const handleLearnMore = () => {
    trackEvent({ ...ORG_EVENTS.INFO_MODAL, label: ORG_LABELS.org_dashboard_card })
    setIsInfoOpen(true)
  }

  return (
    <>
      <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
        <Box position="relative" width={1}>
          <Box className={css.iconBG}>
            <SvgIcon component={LightbulbIcon} inheritViewBox />
          </Box>

          <Button
            onClick={handleLearnMore}
            variant="outlined"
            size="compact"
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
            }}
            aria-label="Invite team members"
          >
            Learn more
          </Button>
        </Box>
        <Box>
          <Typography variant="body1" color="text.primary" fontWeight={700} mb={1}>
            Explore organizations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seamlessly use your Safe Accounts from one place and collaborate with your team members.
          </Typography>
        </Box>
      </Paper>
      {isInfoOpen && <OrgsInfoModal showButtons={false} onClose={() => setIsInfoOpen(false)} />}
    </>
  )
}

export default OrgsCTACard
