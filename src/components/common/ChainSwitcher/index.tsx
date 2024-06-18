import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { Box, Button } from '@mui/material'
import { useCurrentChain } from '@/hooks/useChains'
import useOnboard from '@/hooks/wallets/useOnboard'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import css from './styles.module.css'
// import { switchWalletChain } from '@/services/tx/tx-sender/sdk'
import useWallet from '@/hooks/wallets/useWallet'
import { toQuantity } from 'ethers'

const ChainSwitcher = ({ fullWidth }: { fullWidth?: boolean }): ReactElement | null => {
  const chain = useCurrentChain()
  const onboard = useOnboard()
  const isWrongChain = useIsWrongChain()
  const wallet = useWallet()

  const handleChainSwitch = useCallback(async () => {
    if (!wallet || !chain) return

    // await switchWalletChain(onboard, chain.chainId)
    await wallet?.provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: toQuantity(parseInt(chain.chainId)) }],
    })
  }, [chain, onboard])

  if (!isWrongChain) return null

  return (
    <Button onClick={handleChainSwitch} variant="outlined" size="small" fullWidth={fullWidth} color="primary">
      Switch to&nbsp;
      <Box className={css.circle} bgcolor={chain?.theme?.backgroundColor || ''} />
      &nbsp;{chain?.chainName}
    </Button>
  )
}

export default ChainSwitcher
