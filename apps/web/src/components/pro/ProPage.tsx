import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import ShieldIcon from '@mui/icons-material/Shield'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PersonIcon from '@mui/icons-material/Person'
import css from './styles.module.css'
import Grid from '@mui/material/Grid2'
import ActionCard from './ActionCard'

interface ProPageProps {
  isRegistered: boolean
  hasSubscription: boolean
  onRegister: () => void
  onManageSubscription: () => void
  onViewInvoices: () => void
  onAccountManagement: () => void
}

const ProPage: React.FC<ProPageProps> = ({
  isRegistered,
  hasSubscription,
  onRegister,
  onManageSubscription,
  onViewInvoices,
  onAccountManagement,
}) => {
  return (
    <Box className={css.homeContainer}>
      <Paper elevation={2} className={css.homePaper}>
        <Box className={css.heroSection}>
          <Typography variant="h3" component="h1" align="center" gutterBottom fontWeight="700">
            Safe Pro
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {(!isRegistered || !hasSubscription) && (
            <Grid size={{ xs: 12, md: 4 }}>
              <ActionCard
                title={!isRegistered ? 'Get Started' : 'Upgrade Your Wallet'}
                description={
                  !isRegistered
                    ? 'Register and subscribe to Safe Pro to access premium security features for your wallet.'
                    : 'Enhance your wallet with a Safe Pro subscription plan.'
                }
                icon={<ShieldIcon />}
                buttonText={!isRegistered ? 'Register Now' : 'View Plans'}
                buttonColor="primary"
                onClick={onRegister}
              />
            </Grid>
          )}

          {hasSubscription && (
            <Grid size={{ xs: 12, md: 4 }}>
              <ActionCard
                title="Manage Subscription"
                description="View and manage your current Safe Pro subscription, update plan, or cancel anytime."
                icon={<ShieldIcon />}
                buttonText="Manage Subscription"
                buttonColor="success"
                onClick={onManageSubscription}
              />
            </Grid>
          )}

          {isRegistered && (
            <Grid size={{ xs: 12, md: 4 }}>
              <ActionCard
                title="Billing History"
                description="View and download your invoices and payment history for your Safe Pro subscription."
                icon={<ReceiptIcon />}
                buttonText="View Invoices"
                buttonColor="secondary"
                buttonVariant="outlined"
                onClick={onViewInvoices}
              />
            </Grid>
          )}

          {isRegistered && (
            <Grid size={{ xs: 12, md: 4 }}>
              <ActionCard
                title="Account Settings"
                description="Update your account information, billing details, and contact preferences."
                icon={<PersonIcon />}
                buttonText="Manage Account"
                buttonColor="secondary"
                buttonVariant="outlined"
                onClick={onAccountManagement}
              />
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  )
}

export default ProPage
