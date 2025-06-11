import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import css from './styles.module.css'
import type { UserSubscription } from './types'
import { SubscriptionStatus } from './types'
import Grid from '@mui/material/Grid2'
import { cancelSubscription } from '@/services/pro/api'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'

interface ManageSubscriptionProps {
  subscriptions: UserSubscription[]
  onGoBack: () => void
}

const ManageSubscription: React.FC<ManageSubscriptionProps> = ({ subscriptions, onGoBack }) => {
  const spaceId = useCurrentSpaceId()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState<boolean>(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false)
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null)

  const handleOpenCancelDialog = (subscriptionId: string) => {
    setSelectedSubscription(subscriptionId)
    setCancelDialogOpen(true)
  }

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false)
    setSelectedSubscription(null)
  }

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return

    setLoading(true)
    setError(null)

    try {
      if (spaceId === null) {
        return
      }
      await cancelSubscription(selectedSubscription, spaceId)
      // Update the subscription in the list to show as pending cancellation
      const updatedSubscriptions = subscriptions.map((sub) =>
        sub.id === selectedSubscription ? { ...sub, cancel_at_period_end: true } : sub,
      )

      // Here we would update the state but since the subscriptions are passed as props,
      // the parent component would need to handle this update

      setSuccess('Subscription cancellation scheduled for the end of the billing period.')
      setIsCancelled(true)
    } catch (err) {
      console.error('Error canceling subscription:', err)
      setError('Failed to cancel subscription. Please try again later.')
    } finally {
      setLoading(false)
      handleCloseCancelDialog()
    }
  }

  return (
    <Box className={css.subscriptionContainer}>
      <Paper elevation={2} className={css.subscriptionPaper}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={onGoBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="500">
            Manage Subscriptions
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="info" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {subscriptions.length === 0 ? (
          <Alert severity="info">You don't have any active subscriptions.</Alert>
        ) : (
          <Grid container spacing={3}>
            {subscriptions.map((subscription) => (
              <Grid size={{ xs: 12 }} key={subscription.id}>
                <Card variant="outlined" className={css.subscriptionCard}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h5" component="div">
                        {subscription.plan.name}
                      </Typography>

                      {!isCancelled && (
                        <Chip label={subscription.cancelledAt ? 'Cancels at period end' : subscription.status} />
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Subscription ID
                        </Typography>
                        <Typography variant="body1">{subscription.id}</Typography>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Price
                        </Typography>
                        <Typography variant="body1">{subscription.plan.price} / TODO</Typography>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {subscription.status}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenCancelDialog(subscription.id)}
                      disabled={
                        loading ||
                        isCancelled ||
                        (subscription.status !== SubscriptionStatus.ACTIVE &&
                          !subscription.cancellable &&
                          spaceId !== null)
                      }
                    >
                      Cancel Subscription
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Box mt={4} display="flex" justifyContent="center">
          <Button variant="contained" onClick={onGoBack}>
            Back
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">Cancel Subscription</DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            Are you sure you want to cancel your Safe Pro subscription? Your subscription will remain active until the
            end of the current billing period, then it will be cancelled.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={loading}>
            Keep Subscription
          </Button>
          <Button onClick={handleCancelSubscription} color="error" disabled={loading} variant="contained">
            {loading ? <CircularProgress size={24} /> : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManageSubscription
