import { Alert, AlertTitle, Box } from '@mui/material'
import { useCurrentChain } from '@/hooks/useChains'
import ChainSwitcher from '@/components/common/ChainSwitcher'

const NetworkWarning = () => {
  const chain = useCurrentChain()

  if (!chain) return null

  return (
    <Alert severity="warning" sx={{ mt: 3 }}>
      <AlertTitle sx={{ fontWeight: 700 }}>Change your wallet network</AlertTitle>
      You are trying to create a Super Account on {chain.chainName}. Make sure that your wallet is set to the same
      network.
      <Box mt={2}>
        <ChainSwitcher />
      </Box>
    </Alert>
  )
}

export default NetworkWarning
