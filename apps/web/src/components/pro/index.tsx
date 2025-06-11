import React from 'react'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import Register from '@/components/pro/Register'
import SelectPlan from '@/components/pro/SelectPlan'
import Subscribe from '@/components/pro/Subscribe'
import ProPage from '@/components/pro/ProPage'
import ManageSubscription from '@/components/pro/ManageSubscription'
import InvoiceList from '@/components/pro/InvoiceList'
import AccountManagement from '@/components/pro/AccountManagement'
import SubscriptionStepper from '@/components/pro/SubscriptionStepper'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import type { PaymentMethod, UserSubscription } from '@/components/pro/types'
import { ProPageState } from '@/components/pro/types'
import { fetchCustomerSubscriptions } from '@/services/pro/api'
import { PayinCryptoSelector } from './PayInCrypto'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import useAsync from '@safe-global/utils/hooks/useAsync'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)

const SUBSCRIPTION_STEPS = ['Register', 'Select Plan', 'Payment']

const RegisterComponent = ({
  onRegistered,
  activeStep,
}: {
  onRegistered: (safeAddress: string) => void
  activeStep: number
}) => (
  <>
    <SubscriptionStepper activeStep={activeStep} steps={SUBSCRIPTION_STEPS} showBackButton={false}>
      <Register onRegistered={onRegistered} />
    </SubscriptionStepper>
  </>
)

const SelectPlanComponent = ({
  onPlanSelected,
  customerId,
  activeStep,
  onBack,
}: {
  onPlanSelected: (subscriptionId: string, clientSecret: string, paymentMethod: PaymentMethod, planId: string) => void
  customerId: string | null
  activeStep: number
  onBack: () => void
}) => (
  <>
    <SubscriptionStepper activeStep={activeStep} steps={SUBSCRIPTION_STEPS} showBackButton={false} onBack={onBack}>
      <SelectPlan customerId={customerId} onPlanSelected={onPlanSelected} />
    </SubscriptionStepper>
  </>
)

const PayForSubscription = ({
  onSubscribe,
  clientSecret,
  activeStep,
  onBack,
}: {
  onSubscribe: () => void
  clientSecret: string | null
  activeStep: number
  onBack: () => void
}) => {
  if (!clientSecret) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Loading payment information...</Typography>
        <CircularProgress sx={{ mt: 2 }} />
      </Paper>
    )
  }

  // Configure Stripe appearance options for a consistent UI
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        fontFamily: '"Roboto", sans-serif',
        borderRadius: '4px',
        colorPrimary: '#12FF80',
        colorBackground: '#121312',
        colorText: '#FFFFFF',
        colorDanger: '#fa755a',
      },
    },
  }

  return (
    <SubscriptionStepper activeStep={activeStep} steps={SUBSCRIPTION_STEPS} onBack={onBack}>
      <Elements stripe={stripePromise} options={options}>
        <Subscribe clientSecret={clientSecret} onSubscribe={onSubscribe} />
      </Elements>
    </SubscriptionStepper>
  )
}

const PayForSubscriptionInCrypto = ({
  planId,
  onPayment,
  activeStep,
  onBack,
}: {
  planId: string
  onPayment: () => void
  activeStep: number
  onBack: () => void
}) => {
  return (
    <SubscriptionStepper activeStep={activeStep} steps={SUBSCRIPTION_STEPS} onBack={onBack}>
      <PayinCryptoSelector planId={planId} />
    </SubscriptionStepper>
  )
}

const Pro = () => {
  const spaceId = useCurrentSpaceId()
  const [pageState, setPageState] = React.useState<ProPageState>(ProPageState.HOME)
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRegistered, setIsRegistered] = React.useState(false)
  const [subscriptions, setSubscriptions] = React.useState<UserSubscription[]>([])
  const [planId, setPlanId] = React.useState<string | null>(null)
  const [activeStep, setActiveStep] = React.useState(0)

  useAsync(async () => {
    setIsLoading(true)

    // const safeAddress = ((safe as string).match(/^(?:.{3}:)?(.+)$/) || [])[1]
    const data = await fetchCustomerSubscriptions(spaceId as string)
    setSubscriptions(data.subscriptions || [])
    setIsRegistered(data.isRegistered || false)

    // Set page state based on user status
    if (data.isRegistered) {
      if (data.subscriptions && data.subscriptions.length > 0) {
        // User has active subscriptions, show manage subscription
        setPageState(ProPageState.HOME)
      } else {
        // User is registered but has no subscription, start from plan selection
        setPageState(ProPageState.HOME)
        setActiveStep(1)
      }
    } else {
      // User is not registered, start from home page
      setPageState(ProPageState.HOME)
    }

    setIsLoading(false)
  }, [])

  // Navigation handlers
  const navigateToHome = () => {
    setPageState(ProPageState.HOME)
  }

  const startRegistration = () => {
    setActiveStep(0)
    setPageState(ProPageState.REGISTER)
  }

  const navigateToInvoices = () => {
    setPageState(ProPageState.VIEW_INVOICES)
  }

  const navigateToAccountManagement = () => {
    setPageState(ProPageState.ACCOUNT_MANAGEMENT)
  }

  const navigateToManageSubscription = () => {
    setPageState(ProPageState.MANAGE_SUBSCRIPTION)
  }

  // Step handlers
  const handleRegistered = (customerId: string) => {
    setIsRegistered(true)
    setActiveStep(1)
    setPageState(ProPageState.SELECT_PLAN)
  }

  const handlePlanSelection = (
    subscriptionId: string,
    clientSecret: string,
    paymentMethod: PaymentMethod,
    planId: string,
  ) => {
    setClientSecret(clientSecret)
    setActiveStep(2)

    console.log('Selected plan:', planId, 'with payment method:', paymentMethod)

    if (paymentMethod === 'crypto') {
      console.log('setting page state: User selected crypto payment method')
      setPageState(ProPageState.PAY_FOR_SUBSCRIPTION_IN_CRYPTO)
    } else {
      console.log('setting page state: User selected fiat payment method')
      setPageState(ProPageState.PAY_FOR_SUBSCRIPTION)
    }
    setPlanId(planId)
  }

  const handleSubscription = async () => {
    setIsLoading(true)
    const data = await fetchCustomerSubscriptions(spaceId as string)
    setSubscriptions(data.subscriptions || [])
    setIsLoading(false)
    setPageState(ProPageState.MANAGE_SUBSCRIPTION)
  }

  const handlePayment = async () => {
    setIsLoading(true)
    const data = await fetchCustomerSubscriptions(spaceId as string)
    setSubscriptions(data.subscriptions || [])
    setIsLoading(false)
    setPageState(ProPageState.MANAGE_SUBSCRIPTION)
  }

  const handleBackToRegister = () => {
    setActiveStep(0)
    setPageState(ProPageState.REGISTER)
  }

  const handleBackToPlanSelection = () => {
    setActiveStep(1)
    setPageState(ProPageState.SELECT_PLAN)
  }

  // Render content based on current page state
  let content: React.ReactNode
  if (isLoading) {
    content = (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    )
  } else {
    switch (pageState) {
      case ProPageState.HOME:
        content = (
          <ProPage
            isRegistered={isRegistered}
            hasSubscription={subscriptions.length > 0}
            onRegister={isRegistered ? () => setPageState(ProPageState.SELECT_PLAN) : startRegistration}
            onManageSubscription={navigateToManageSubscription}
            onViewInvoices={navigateToInvoices}
            onAccountManagement={navigateToAccountManagement}
          />
        )
        break
      case ProPageState.REGISTER:
        content = <RegisterComponent onRegistered={handleRegistered} activeStep={activeStep} />
        break
      case ProPageState.SELECT_PLAN:
        content = (
          <SelectPlanComponent
            customerId={spaceId as string}
            onPlanSelected={handlePlanSelection}
            activeStep={activeStep}
            onBack={handleBackToRegister}
          />
        )
        break
      case ProPageState.PAY_FOR_SUBSCRIPTION:
        content = (
          <PayForSubscription
            clientSecret={clientSecret}
            onSubscribe={handleSubscription}
            activeStep={activeStep}
            onBack={handleBackToPlanSelection}
          />
        )
        break
      case ProPageState.PAY_FOR_SUBSCRIPTION_IN_CRYPTO:
        content = (
          <PayForSubscriptionInCrypto
            planId={planId as string}
            onPayment={handlePayment}
            activeStep={activeStep}
            onBack={handleBackToPlanSelection}
          />
        )
        break
      case ProPageState.MANAGE_SUBSCRIPTION:
        content = <ManageSubscription subscriptions={subscriptions} onGoBack={navigateToHome} />
        break
      case ProPageState.VIEW_INVOICES:
        content = <InvoiceList onGoBack={navigateToHome} />
        break
      case ProPageState.ACCOUNT_MANAGEMENT:
        content = <AccountManagement onGoBack={navigateToHome} />
        break
      default:
        content = null
    }
  }

  return <Box m={2}>{content}</Box>
}

export default Pro
