import { Alert } from '@/src/components/Alert'

export const TwapFallbackHandlerWarning = () => {
  return (
    <Alert
      message={'Enable TWAPs and submit order.'}
      iconName={'info'}
      info={
        'To enable TWAP orders you need to set a custom fallback handler. This software is developed by CoW Swap and\n' +
        'Safe will not be responsible for any possible issues with it.'
      }
      type="warning"
    />
  )
}
