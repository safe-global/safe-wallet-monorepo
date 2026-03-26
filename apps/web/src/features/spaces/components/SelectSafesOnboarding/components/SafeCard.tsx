import { Controller, useFormContext } from 'react-hook-form'
import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import type { AddAccountsFormValues } from '@/features/spaces/components/AddAccounts/index'

import useSafeCardData from '../hooks/useSafeCardData'
import { SafeCardLayout } from './SafeCardLayout'

const getSafeId = (safeItem: SafeItem) => `${safeItem.chainId}:${safeItem.address}`
const getMultiChainSafeId = (mcSafe: MultiChainSafeItem) => `multichain_${mcSafe.address}`

interface SafeCardProps {
  safe: SafeItem | MultiChainSafeItem
  isSimilar?: boolean
}

const SafeCard = ({ safe, isSimilar }: SafeCardProps) => {
  const isMultiChain = isMultiChainSafeItem(safe)
  const { setValue, watch, control } = useFormContext<AddAccountsFormValues>()
  const { name, fiatValue, threshold, ownersCount, elementRef } = useSafeCardData(safe)
  const safes = isMultiChain ? (safe as MultiChainSafeItem).safes : [safe as SafeItem]

  const subSafeIds = isMultiChain ? (safe as MultiChainSafeItem).safes.map(getSafeId) : []
  const safeId = isMultiChain ? getMultiChainSafeId(safe as MultiChainSafeItem) : getSafeId(safe as SafeItem)

  const watchedSubSafeIds = subSafeIds.map((id) => `selectedSafes.${id}` as const)
  const subSafeValues = (isMultiChain ? watch(watchedSubSafeIds as readonly string[] as never) : []) as boolean[]
  const allSubSafesChecked = subSafeValues.every(Boolean) && subSafeValues.length > 0

  const handleMultiChainToggle = () => {
    const newValue = !allSubSafesChecked
    setValue(`selectedSafes.${safeId}`, newValue, { shouldValidate: true })
    subSafeIds.forEach((id) => {
      setValue(`selectedSafes.${id}`, newValue, { shouldValidate: true })
    })
  }

  if (isMultiChain) {
    return (
      <SafeCardLayout
        ref={elementRef as React.Ref<HTMLButtonElement>}
        checked={allSubSafesChecked}
        onToggle={handleMultiChainToggle}
        name={name}
        address={safe.address}
        safes={safes}
        fiatValue={fiatValue}
        threshold={threshold}
        ownersCount={ownersCount}
        isSimilar={isSimilar}
      />
    )
  }

  return (
    <Controller
      name={`selectedSafes.${safeId}`}
      control={control}
      render={({ field }) => (
        <SafeCardLayout
          ref={elementRef as React.Ref<HTMLButtonElement>}
          checked={Boolean(field.value)}
          onToggle={() => field.onChange(!field.value)}
          onCheckedChange={(checked) => field.onChange(checked)}
          name={name}
          address={safe.address}
          safes={safes}
          fiatValue={fiatValue}
          threshold={threshold}
          ownersCount={ownersCount}
          isSimilar={isSimilar}
        />
      )}
    />
  )
}

export { getSafeId, getMultiChainSafeId }
export default SafeCard
