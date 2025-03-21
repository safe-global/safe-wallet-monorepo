import { skipToken } from '@reduxjs/toolkit/query'
import { useContext, useEffect, useMemo } from 'react'
import type { ReactElement } from 'react'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/safe-core-sdk-types'

import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import useBalances from '@/hooks/useBalances'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { getLatestSafeVersion } from '@/utils/chains'
import useAsync from '@/hooks/useAsync'
import { createNewUndeployedSafeWithoutSalt, encodeSafeCreationTx } from '@/components/new-safe/create/logic'
import { useGetOwnedSafesQuery } from '@/store/slices'
import { predictAddressBasedOnReplayData } from '@/features/multichain/utils/utils'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { createTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { SetupNestedSafeFormAssetFields } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'
import type { SetupNestedSafeForm } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'

export function ReviewNestedSafe({ params }: { params: SetupNestedSafeForm }): ReactElement {
  const dispatch = useAppDispatch()
  const { safeAddress, safe, safeLoaded } = useSafeInfo()
  const chain = useCurrentChain()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { balances } = useBalances()
  const provider = useWeb3ReadOnly()
  const { data: nestedSafes } = useGetOwnedSafesQuery(
    safeLoaded ? { chainId: safe.chainId, ownerAddress: safeAddress } : skipToken,
  )
  const version = getLatestSafeVersion(chain)

  const safeAccountConfig = useMemo(() => {
    if (!chain || !nestedSafes) {
      return
    }

    const undeployedSafe = createNewUndeployedSafeWithoutSalt(
      version,
      {
        owners: [safeAddress],
        threshold: 1,
      },
      chain,
    )
    const saltNonce = Date.now().toString()

    return {
      ...undeployedSafe,
      saltNonce,
    }
  }, [chain, safeAddress, nestedSafes, version])

  const [predictedSafeAddress] = useAsync(async () => {
    if (provider && safeAccountConfig) {
      return predictAddressBasedOnReplayData(safeAccountConfig, provider)
    }
  }, [provider, safeAccountConfig])

  useEffect(() => {
    if (!chain || !safeAccountConfig || !predictedSafeAddress) {
      return
    }

    const deploymentTx = {
      to: safeAccountConfig.factoryAddress,
      data: encodeSafeCreationTx(safeAccountConfig, chain),
      value: '0',
    }

    const fundingTxs: Array<MetaTransactionData> = []

    for (const asset of params.assets) {
      const token = balances.items.find((item) => {
        return item.tokenInfo.address === asset[SetupNestedSafeFormAssetFields.tokenAddress]
      })

      if (token) {
        fundingTxs.push(
          createTokenTransferParams(
            predictedSafeAddress,
            asset[SetupNestedSafeFormAssetFields.amount],
            token.tokenInfo.decimals,
            token.tokenInfo.address,
          ),
        )
      }
    }

    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = fundingTxs.length > 0
      return isMultiSend ? createMultiSendCallOnlyTx([deploymentTx, ...fundingTxs]) : createTx(deploymentTx)
    }

    createSafeTx().then(setSafeTx).catch(setSafeTxError)
  }, [chain, params.assets, safeAccountConfig, predictedSafeAddress, balances.items, setSafeTx, setSafeTxError])

  const onSubmit = () => {
    if (!predictedSafeAddress) {
      return
    }
    dispatch(
      upsertAddressBookEntries({
        chainIds: [safe.chainId],
        address: predictedSafeAddress,
        name: params.name,
      }),
    )
  }

  return <SignOrExecuteForm onSubmit={onSubmit} />
}
