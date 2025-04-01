import { Alert, AlertTitle, Box } from '@mui/material'
import { useCurrentChain } from '@/hooks/useChains'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import { useIsUnsupportedChain } from '@/hooks/useIsUnsupportedChain'

const NetworkWarning = () => {
  const chain = useCurrentChain()
  const isUnsupportedChain = useIsUnsupportedChain()

  if (!chain && !isUnsupportedChain) return null

  const message = isUnsupportedChain ? (
    <>
      <strong>Unfortunately, creating a Safe Account on {chain.chainName} is disabled. </strong> Please switch to a
      supported network.
    </>
  ) : (
    `You are trying to create a Safe Account on ${chain.chainName}. Make sure that your wallet is set to the same
      network.`
  )

  return (
    <Alert severity="warning" sx={{ mt: 3 }}>
      <AlertTitle sx={{ fontWeight: 700 }}>Change your wallet network</AlertTitle>
      {message}
      {!isUnsupportedChain && (
        <Box mt={2}>
          <ChainSwitcher />
        </Box>
      )}
    </Alert>
  )
}

export default NetworkWarning
