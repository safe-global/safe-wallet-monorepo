import { Alert, AlertDescription } from '@/components/ui/alert'
import InfoOutlinedIcon from '@/public/images/notifications/info.svg'

export const TwapFallbackHandlerWarning = () => {
  return (
    <Alert variant="warning" className="mb-2">
      <InfoOutlinedIcon />
      <AlertDescription>
        <b>Enable TWAPs and submit order.</b>
        {` `}
        To enable TWAP orders you need to set a custom fallback handler. This software is developed by CoW Swap and Safe
        will not be responsible for any possible issues with it.
      </AlertDescription>
    </Alert>
  )
}
