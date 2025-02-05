import type { ReactElement } from 'react'
import { Alert, SvgIcon } from '@mui/material'
import InfoOutlinedIcon from '@/public/images/notifications/info.svg'
import { useIsOfficialFallbackHandler } from '@/hooks/useIsOfficialFallbackHandler'
import { useIsTWAPFallbackHandler } from '@/features/swap/hooks/useIsTWAPFallbackHandler'
import { FallbackHandlerWarning } from '@/components/settings/FallbackHandler'

export const UntrustedFallbackHandlerTxText = ({ isTxExecuted = false }: { isTxExecuted?: boolean }) => (
  <>
    <FallbackHandlerWarning
      message={
        <>
          This transaction {isTxExecuted ? 'has set' : 'sets'} an <b>unofficial</b> fallback handler.
        </>
      }
      txBuilderLinkPrefix={isTxExecuted ? 'It can be altered via the' : ''}
    />
    {!isTxExecuted && (
      <>
        <br />
        <b>Proceed with caution:</b> ensure the fallback handler address is trusted and secure. If unsure, do not
        proceed.
      </>
    )}
  </>
)

export const UntrustedFallbackHandlerTxAlert = ({
  fallbackHandler,
  isTxExecuted = false,
}: {
  fallbackHandler: string
  isTxExecuted?: boolean
}): ReactElement | null => {
  const isOfficial = useIsOfficialFallbackHandler(fallbackHandler)
  const isTWAPFallbackHandler = useIsTWAPFallbackHandler(fallbackHandler)

  if (isOfficial || isTWAPFallbackHandler) {
    return null
  }

  return (
    <Alert
      severity="warning"
      icon={<SvgIcon component={InfoOutlinedIcon} inheritViewBox color="error" />}
      sx={{ mb: 1 }}
    >
      <UntrustedFallbackHandlerTxText isTxExecuted={isTxExecuted} />
    </Alert>
  )
}
