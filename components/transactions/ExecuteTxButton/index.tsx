import React, { useState, type ReactElement } from 'react'
import { type TransactionSummary } from '@gnosis.pm/safe-react-gateway-sdk'
import { Button } from '@mui/material'

import css from './styles.module.css'
import useSafeInfo from '@/services/useSafeInfo'
import { isMultisigExecutionInfo } from '@/components/transactions/utils'
import ExecuteTxModal from '@/components/tx/ExecuteTxModal'
import useIsPending from '@/components/transactions/useIsPending'

const ExecuteTxButton = ({ txSummary }: { txSummary: TransactionSummary }): ReactElement => {
  const [open, setOpen] = useState<boolean>(false)
  const { safe } = useSafeInfo()
  const safeNonce = safe?.nonce
  const txNonce = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo.nonce : undefined
  const isPending = useIsPending({ txId: txSummary.id })

  const isNext = !!txNonce && !!safeNonce && txNonce === safeNonce
  const isDisabled = !isNext || isPending

  const onClick = () => {
    setOpen(true)
  }

  return (
    <div className={css.container}>
      <Button onClick={onClick} disabled={isDisabled}>
        Execute
      </Button>

      {open && <ExecuteTxModal onClose={() => setOpen(false)} initialData={[txSummary]} />}
    </div>
  )
}

export default ExecuteTxButton
