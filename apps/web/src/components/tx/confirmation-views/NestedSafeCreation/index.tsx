import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'

import useAsync from '@safe-global/utils/hooks/useAsync'
import { predictSafeAddress } from '@/features/multichain'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useAddressBook from '@/hooks/useAddressBook'
import { _getFactoryAddressAndSetupData } from '@/utils/nested-safes'
import { NestedSafeCreationView } from '@views/components/tx/confirmation-views/NestedSafeCreation/NestedSafeCreationView'

export function NestedSafeCreation({ txData }: { txData: TransactionData }): ReactElement | null {
  const addressBook = useAddressBook()
  const provider = useWeb3ReadOnly()

  const [predictedSafeAddress] = useAsync(async () => {
    if (provider) {
      const { factoryAddress, ...setupData } = _getFactoryAddressAndSetupData(txData)
      return predictSafeAddress(setupData, factoryAddress, provider)
    }
  }, [provider, txData])

  if (!predictedSafeAddress) {
    return null
  }

  return <NestedSafeCreationView name={addressBook[predictedSafeAddress]} address={predictedSafeAddress} />
}
