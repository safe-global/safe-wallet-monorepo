import type { FormEvent } from 'react'
import React, { useState, useEffect } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Box, Typography, Button, Paper, CircularProgress, Alert, AlertTitle } from '@mui/material'
import css from './styles.module.css'

interface SubscribeProps {
  clientSecret: string
  onSubscribe: () => void
}

const Subscribe: React.FC<SubscribeProps> = ({ clientSecret, onSubscribe }) => {
  const [message, setMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [paymentElementReady, setPaymentElementReady] = useState<boolean>(false)
  const [showTestCards, setShowTestCards] = useState<boolean>(true)

  // Initialize an instance of stripe.
  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    if (!stripe) {
      console.log("Stripe.js hasn't loaded yet.")
    }

    if (!clientSecret) {
      setMessage('Missing payment information. Please try again.')
    }
  }, [stripe, clientSecret])

  if (!stripe || !elements) {
    // Stripe.js has not loaded yet. Make sure to disable
    // form submission until Stripe.js has loaded.
    return (
      <Box className={css.subscribeContainer}>
        <Paper elevation={3} className={css.subscribePaper}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px',
              flexDirection: 'column',
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Loading payment form...
            </Typography>
          </Box>
        </Paper>
      </Box>
    )
  }
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsProcessing(true)
    setMessage(null)

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setMessage(submitError.message || 'Payment submission error')
      setIsProcessing(false)
      return
    }

    // Use the clientSecret and Elements instance to confirm the setup
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        // return_url: window.location.origin + window.location.pathname,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message || 'Payment error')
      setIsProcessing(false)
      return
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment successful! Your subscription is now active.')
    }

    setIsProcessing(false)
    onSubscribe()
  }

  return (
    <Box className={css.subscribeContainer}>
      <Paper elevation={3} className={css.subscribePaper}>
        <Typography variant="h4" component="h1" align="center" gutterBottom fontWeight="500">
          Complete Your Subscription
        </Typography>

        <Typography variant="body1" align="center" color="text.secondary" paragraph>
          Enter your payment details to activate your subscription
        </Typography>

        {showTestCards && (
          <Alert severity="info" className={css.subscribeAlert} onClose={() => setShowTestCards(false)}>
            <AlertTitle>Test Mode</AlertTitle>
            <Typography variant="body2" gutterBottom>
              Use these test cards:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 0 }}>
              <li>
                <strong>Success:</strong> 4242 4242 4242 4242
              </li>
              <li>
                <strong>Authentication:</strong> 4000 0025 0000 3155
              </li>
              <li>Any future expiry date, any CVC, any postal code</li>
            </Box>
          </Alert>
        )}

        {message && (
          <Alert severity={message.includes('successful') ? 'success' : 'error'} className={css.subscribeAlert}>
            {message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ my: 3 }}>
            <PaymentElement
              id="payment-element"
              options={{
                layout: 'tabs',
              }}
              onReady={() => setPaymentElementReady(true)}
            />
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={isProcessing || !paymentElementReady}
              className={css.subscribeButton}
            >
              {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Subscribe Now'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  )
}

export default Subscribe
