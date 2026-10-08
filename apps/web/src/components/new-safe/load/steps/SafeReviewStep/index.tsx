import React from 'react'

import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { LoadSafeFormData } from '@/components/new-safe/load'
import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { useRouter } from 'next/router'
import { addOrUpdateSafe } from '@/store/addedSafesSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { LOAD_SAFE_EVENTS, OPEN_SAFE_LABELS, OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { SafeReviewStepView } from '@views/components/new-safe/load/steps/SafeReviewStep/SafeReviewStepView'

const SafeReviewStep = ({ data, onBack }: StepRenderProps<LoadSafeFormData>) => {
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const chainId = chain?.chainId || ''

  const addSafe = () => {
    const safeName = data.name
    const safeAddress = data.address

    dispatch(
      addOrUpdateSafe({
        safe: {
          ...defaultSafeInfo,
          address: { value: safeAddress, name: safeName },
          threshold: data.threshold,
          owners: data.owners.map((owner) => ({
            value: owner.address,
            name: owner.name || owner.ens,
          })),
          chainId,
        },
      }),
    )

    dispatch(
      upsertAddressBookEntries({
        chainIds: [chainId],
        address: safeAddress,
        name: safeName,
      }),
    )

    for (const { address, name, ens } of data.owners) {
      const entryName = name || ens

      if (!entryName) {
        continue
      }

      dispatch(
        upsertAddressBookEntries({
          chainIds: [chainId],
          address,
          name: entryName,
        }),
      )
    }

    trackEvent({
      ...LOAD_SAFE_EVENTS.OWNERS,
      label: data.owners.length,
    })

    trackEvent({
      ...LOAD_SAFE_EVENTS.THRESHOLD,
      label: data.threshold,
    })

    trackEvent({ ...OVERVIEW_EVENTS.OPEN_SAFE, label: OPEN_SAFE_LABELS.after_add })

    router.push({
      pathname: AppRoutes.home,
      // eslint-disable-next-line no-restricted-syntax -- A loaded Safe goes to My accounts, not to a Workspace
      query: { safe: `${chain?.shortName}:${safeAddress}` },
    })
  }

  const handleBack = () => {
    onBack(data)
  }

  return (
    <SafeReviewStepView
      chainIndicator={<ChainIndicator chainId={chain?.chainId} inline />}
      name={data.name}
      ownerInfos={data.owners.map((owner, index) => (
        <EthHashInfo
          address={owner.address}
          name={owner.name || owner.ens}
          shortAddress={false}
          showPrefix={false}
          showName
          hasExplorer
          showCopyButton
          key={index}
        />
      ))}
      threshold={data.threshold}
      ownerCount={data.owners.length}
      onBack={handleBack}
      onAdd={addSafe}
    />
  )
}

export default SafeReviewStep
