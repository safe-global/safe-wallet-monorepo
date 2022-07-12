import { useState, type ReactElement } from 'react'
import Button from '@mui/material/Button'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import TokenTransferModal from '@/components/tx/modals/TokenTransferModal'
import { isOwner } from '@/utils/transaction-guards'

import css from './styles.module.css'

const NewTxButton = (): ReactElement => {
  const [txOpen, setTxOpen] = useState<boolean>(false)
  const { safe } = useSafeInfo()
  const wallet = useWallet()
  const isSafeOwner = isOwner(safe?.owners, wallet?.address)
  const isWrongChain = wallet?.chainId !== safe?.chainId

  return (
    <>
      <Button
        onClick={() => setTxOpen(true)}
        variant="contained"
        size="small"
        disabled={!isSafeOwner || isWrongChain}
        fullWidth
        className={css.button}
        disableElevation
      >
        {!wallet
          ? 'Not connected'
          : isWrongChain
          ? 'Wrong wallet chain'
          : isSafeOwner
          ? 'New transaction'
          : 'Read only'}
      </Button>

      {txOpen && <TokenTransferModal onClose={() => setTxOpen(false)} />}
    </>
  )
}

export default NewTxButton
