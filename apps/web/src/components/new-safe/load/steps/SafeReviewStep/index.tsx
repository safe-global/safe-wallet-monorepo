import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { LoadSafeFormData } from '@/components/new-safe/load'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import ChainIndicator from '@/components/common/ChainIndicator'
import css from '@/components/new-safe/create/steps/ReviewStep/styles.module.css'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { useRouter } from 'next/router'
import { addOrUpdateSafe } from '@/store/addedSafesSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { LOAD_SAFE_EVENTS, OPEN_SAFE_LABELS, OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import ReviewRow from '@/components/new-safe/ReviewRow'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { maybePlural } from '@safe-global/utils/utils/formatters'

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
      query: { safe: `${chain?.shortName}:${safeAddress}` },
    })
  }

  const handleBack = () => {
    onBack(data)
  }

  return (
    <>
      <div className={layoutCss.row}>
        <div className="grid grid-cols-12 gap-6">
          <ReviewRow name="Network" value={<ChainIndicator chainId={chain?.chainId} inline />} />
          <ReviewRow name="Name" value={<Typography>{data.name}</Typography>} />
          <ReviewRow
            name="Signers"
            value={
              <div className={css.ownersArray}>
                {data.owners.map((owner, index) => (
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
              </div>
            }
          />
          <ReviewRow
            name="Threshold"
            value={
              <Typography>
                {data.threshold} out of {data.owners.length} signer{maybePlural(data.owners)}
              </Typography>
            }
          />
        </div>
      </div>
      <Separator />
      <div className={layoutCss.row}>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="lg" onClick={handleBack}>
            Back
          </Button>
          <Button type="button" size="lg" onClick={addSafe}>
            Add
          </Button>
        </div>
      </div>
    </>
  )
}

export default SafeReviewStep
