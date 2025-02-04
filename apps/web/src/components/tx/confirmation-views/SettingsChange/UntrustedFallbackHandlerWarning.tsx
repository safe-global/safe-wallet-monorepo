import { Alert, SvgIcon } from '@mui/material'
import InfoOutlinedIcon from '@/public/images/notifications/info.svg'
import { useIsOfficialFallbackHandler } from '@/hooks/useIsOfficialFallbackHandler'
import { useIsTWAPFallbackHandler } from '@/features/swap/hooks/useIsTWAPFallbackHandler'

export const UntrustedFallbackHandlerAlert = ({ fallbackHandler }: { fallbackHandler: string }) => {
  const isOfficial = useIsOfficialFallbackHandler(fallbackHandler)
  const isTWAPFallbackHandler = useIsTWAPFallbackHandler(fallbackHandler)

  if (isOfficial || isTWAPFallbackHandler) {
    return <></>
  }

  return (
    <Alert
      severity="warning"
      icon={<SvgIcon component={InfoOutlinedIcon} inheritViewBox color="error" />}
      sx={{ mb: 1 }}
    >
      This transaction sets an <b>unofficial</b> fallback handler.
      <br />
      <b>Proceed with caution:</b> Ensure the fallback handler address is trusted and secure. If unsure, do not proceed.
    </Alert>
  )
}
