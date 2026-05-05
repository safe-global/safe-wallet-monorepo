import TxCard from '@/components/tx-flow/common/TxCard'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import GnosisPayExecutionForm from './GnosisPayExecutionForm'
import { type GnosisPayTxItem } from '@/store/gnosisPayTxsSlice'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useContext, useEffect } from 'react'
import SafeTxProvider, { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createTx } from '@/services/tx/tx-sender'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'

const ExecuteGnosisPayModal = ({ gnosisPayTx }: { gnosisPayTx: GnosisPayTxItem }) => {
  const { setSafeTx } = useContext(SafeTxContext)

  const [fakeSafeTx] = useAsync(() => {
    return createTx(gnosisPayTx.safeTxData)
  }, [gnosisPayTx])

  useEffect(() => {
    if (fakeSafeTx) {
      setSafeTx(fakeSafeTx)
    }
  }, [fakeSafeTx, setSafeTx])

  return (
    <TxCard>
      <GnosisPayExecutionForm queuedGnosisPayTx={gnosisPayTx} />
    </TxCard>
  )
}

const ExecuteGnosisPayTx = ({ gnosisPayTx }: { gnosisPayTx: GnosisPayTxItem }) => {
  return (
    <SafeTxProvider>
      <SafeShieldProvider>
        <TxLayout title="Execute Gnosis Pay transaction" step={0}>
          <ExecuteGnosisPayModal gnosisPayTx={gnosisPayTx} />
        </TxLayout>
      </SafeShieldProvider>
    </SafeTxProvider>
  )
}

export default ExecuteGnosisPayTx
