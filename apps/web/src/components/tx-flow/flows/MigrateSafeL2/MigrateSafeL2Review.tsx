import { useContext } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import useAsync from '@/hooks/useAsync'
import { createMigrateToL2 } from '@/utils/safe-migrations'

export const MigrateSafeL2Review = () => {
  const chain = useCurrentChain()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useAsync(async () => {
    if (!chain) return

    const txData = createMigrateToL2(chain)
    createTx(txData).then(setSafeTx).catch(setSafeTxError)
  }, [chain, setSafeTx, setSafeTxError])

  return <SignOrExecuteForm />
}
