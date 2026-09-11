import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Typography } from '@/components/ui/typography'
import type { ReactElement } from 'react'

import useAsync from '@safe-global/utils/hooks/useAsync'
import { predictSafeAddress } from '@/features/multichain'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import EthHashInfo from '@/components/common/EthHashInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { _getFactoryAddressAndSetupData } from '@/utils/nested-safes'

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

  return (
    <div className="flex flex-col gap-2">
      <Typography variant="paragraph-small" className="text-muted-foreground whitespace-nowrap">
        Nested Safe
      </Typography>

      <div>
        <EthHashInfo
          name={addressBook[predictedSafeAddress]}
          address={predictedSafeAddress}
          shortAddress={false}
          hasExplorer
          showCopyButton
          showAvatar
        />
      </div>
    </div>
  )
}
