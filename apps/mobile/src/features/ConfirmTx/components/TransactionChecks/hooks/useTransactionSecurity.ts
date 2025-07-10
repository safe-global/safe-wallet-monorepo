import { useEffect, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useBlockaid } from '@/src/features/TransactionChecks/blockaid/useBlockaid'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import extractTxInfo from '@/src/services/tx/extractTx'
import { useSafeInfo } from '@/src/hooks/useSafeInfo'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { SecuritySeverity } from '@safe-global/utils/services/security/modules/types'

export const useTransactionSecurity = (txDetails?: TransactionDetails) => {
  const activeSafe = useDefinedActiveSafe()
  const safeInfo = useSafeInfo()
  const blockaidEnabled = useHasFeature(FEATURES.RISK_MITIGATION) ?? false
  const [hasScanned, setHasScanned] = useState(false)

  const { scanTransaction, blockaidPayload, error: blockaidError, loading: blockaidLoading } = useBlockaid()

  useEffect(() => {
    const runBlockaidScan = async () => {
      if (!blockaidEnabled || !txDetails || hasScanned) {
        return
      }

      try {
        const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)
        const safeTx = await createExistingTx(txParams, signatures)
        const executionOwner = safeInfo.safe.owners[0].value

        await scanTransaction({
          data: safeTx,
          signer: executionOwner,
        })

        setHasScanned(true)
      } catch (error) {
        console.error('Error running blockaid scan:', error)
        setHasScanned(true)
      }
    }

    runBlockaidScan()
  }, [blockaidEnabled, txDetails, hasScanned, activeSafe.address, safeInfo.safe.owners, scanTransaction])

  // Process scan results
  const isHighRisk = blockaidPayload?.severity === SecuritySeverity.HIGH
  const isMediumRisk = blockaidPayload?.severity === SecuritySeverity.MEDIUM
  const hasIssues = Boolean(blockaidPayload?.payload?.issues && blockaidPayload.payload.issues.length > 0)
  const hasContractManagement = Boolean(
    blockaidPayload?.payload?.contractManagement && blockaidPayload.payload.contractManagement.length > 0,
  )
  const hasWarnings = hasIssues || hasContractManagement

  return {
    enabled: blockaidEnabled,
    isScanning: blockaidLoading,
    hasError: Boolean(blockaidError),
    payload: blockaidPayload,
    error: blockaidError,
    isHighRisk,
    isMediumRisk,
    hasWarnings,
    hasIssues,
    hasContractManagement,
  }
}
