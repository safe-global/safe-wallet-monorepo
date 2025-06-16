import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import Grid from '@mui/material/Grid2'
import css from './styles.module.css'
import { createCryptoPaymentIntent, createSubscriptionIntent, getPlans } from '@/services/pro/api'
import type { CreateSubscriptionInputDto, PaymentMethod, Plan } from './types'

interface SelectPlanProps {
  customerId: string | null
  onPlanSelected: (subscriptionId: string, clientSecret: string, paymentMethod: PaymentMethod, planId: string) => void
}

const SelectPlan: React.FC<SelectPlanProps> = ({ customerId, onPlanSelected }) => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true)
      try {
        const data = await getPlans()
        setPlans(data)
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPrices()
  }, [])

  const createSubscription = async (planId: string) => {
    const input: CreateSubscriptionInputDto = {
      planId,
      customerId: customerId as string,
      spaceId: customerId as string, // Assuming spaceId is the same as customerId
    }
    const { subscriptionId, clientSecret } = await createSubscriptionIntent(input)
    onPlanSelected(subscriptionId, clientSecret, 'fiat', planId)
  }

  const createSubscriptionIntentCrypto = async (priceId: string, safeAddress: string) => {
    // TODO: Use chainId
    const { clientSecret, subscriptionId } = await createCryptoPaymentIntent(priceId, safeAddress, 'crypto', 1)
    onPlanSelected('', '', 'crypto', priceId)
  }

  return (
    <Box className={css.planContainer}>
      <Box className={css.planHeaderContainer}>
        <Typography align="center" color="text.primary" sx={{ mb: 1 }}>
          <strong>Enhance your wallet security and unlock premium features</strong>
        </Typography>
        <Typography align="center" color="text.secondary" variant="body2">
          Safe Pro plans offer advanced security features, reduced transaction fees, and priority support.
        </Typography>

        <Typography variant="h4" component="h1" align="center" gutterBottom fontWeight="500">
          Select Your Safe Pro Plan
        </Typography>

        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 2 }}>
          Choose the plan that best fits your security needs
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <Typography>Loading plans...</Typography>
        </Box>
      ) : (
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => {
            const features = plan.features
            const isStandard = plan.type === 'standard'
            const isPremium = plan.type === 'premium'
            const planName = isStandard ? 'Standard' : 'Premium'

            return (
              <Grid size={{ xs: 12, sm: 10, md: 6, lg: 5 }} key={plan.id}>
                <Card
                  elevation={isPremium ? 4 : 1}
                  className={`${css.planCard} ${isPremium ? css.premiumCard : css.standardCard}`}
                >
                  <CardHeader
                    title={
                      <Typography variant="h5" component="h2" fontWeight="bold" align="center">
                        {planName}
                      </Typography>
                    }
                    subheader={
                      <Typography variant="h4" color="primary" align="center" sx={{ mt: 1, fontWeight: 'medium' }}>
                        ${plan.currentPrice}
                        <Typography variant="body1" component="span" color="text.secondary">
                          {plan.billingCycle}
                        </Typography>
                      </Typography>
                    }
                    sx={{ pb: 0 }}
                  />

                  <CardContent className={css.planCardContent}>
                    <Divider sx={{ my: 2 }} />

                    <List className={css.planFeatureList} disablePadding>
                      {features.map((feature, i) => (
                        <ListItem key={i} disableGutters className={css.planFeatureItem}>
                          <ListItemIcon className={css.planFeatureIcon}>
                            <CheckIcon color="success" />
                          </ListItemIcon>
                          <ListItemText primary={feature} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>

                  {plan.paymentMethod === 'fiat' && (
                    <Box className={css.planButtonContainer}>
                      <Button
                        variant={isPremium ? 'contained' : 'outlined'}
                        color="primary"
                        fullWidth
                        size="large"
                        onClick={() => createSubscription(plan.id)}
                        className={`${css.planButton} ${isPremium ? css.premiumButton : css.standardButton}`}
                      >
                        Select {planName}
                      </Button>
                    </Box>
                  )}

                  {plan.paymentMethod === 'crypto' && (
                    <Box className={css.planButtonContainer}>
                      <Button
                        variant={isPremium ? 'contained' : 'outlined'}
                        color="primary"
                        fullWidth
                        size="large"
                        onClick={() => createSubscriptionIntentCrypto(plan.id, customerId as string)}
                        className={`${css.planButton} ${isPremium ? css.premiumButton : css.standardButton}`}
                      >
                        Select {planName} with Crypto
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}

export default SelectPlan
