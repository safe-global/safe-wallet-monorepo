import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useState, useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import { isAddress } from 'ethers'
import type { ReactElement } from 'react'

import { isSmartContractWallet } from '@/utils/wallets'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import useSafeInfo from '@/hooks/useSafeInfo'
import { UpsertRecoveryFlowFields } from '.'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { RecovererSmartContractWarningView } from '@views/components/tx-flow/flows/UpsertRecovery/RecovererSmartContractWarningView'

export function RecovererWarning(): ReactElement | null {
  const { safe, safeAddress } = useSafeInfo()
  const [warning, setWarning] = useState<boolean>(false)
  const [triggerGetSafe] = useLazySafesGetSafeV1Query()

  const recoverer = useWatch({ name: UpsertRecoveryFlowFields.recoverer })
  const debouncedRecoverer = useDebounce(recoverer, 500)

  useEffect(() => {
    setWarning(false)

    if (!isAddress(debouncedRecoverer) || sameAddress(debouncedRecoverer, safeAddress)) {
      return
    }

    ;(async () => {
      let isSmartContract = false

      try {
        isSmartContract = await isSmartContractWallet(safe.chainId, debouncedRecoverer)
      } catch {
        return
      }

      // EOA
      if (!isSmartContract) {
        return
      }

      try {
        await triggerGetSafe({ chainId: safe.chainId, safeAddress: debouncedRecoverer }).unwrap()
      } catch {
        setWarning(true)
      }
    })()
  }, [debouncedRecoverer, safe.chainId, safeAddress, triggerGetSafe])

  if (!warning) {
    return null
  }

  return <RecovererSmartContractWarningView />
}
