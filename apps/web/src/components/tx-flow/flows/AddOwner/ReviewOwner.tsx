import { useCurrentChain } from '@/hooks/useChains'
import { useContext, useEffect, useMemo, type PropsWithChildren } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeShieldForDeadlockCheck } from '@/features/safe-shield/SafeShieldContext'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createSwapOwnerTx, createAddOwnerTx } from '@/services/tx/tx-sender'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { SafeTxContext } from '../../SafeTxProvider'
import type { AddOwnerFlowProps } from '.'
import type { ReplaceOwnerFlowProps } from '../ReplaceOwner'
import { SettingsChangeContext } from './context'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { computeProjectedState } from '@safe-global/utils/features/safe-shield/utils'
import type { OwnerChange } from '@safe-global/utils/features/safe-shield/types'

export const ReviewOwner = ({
  params,
  onSubmit,
  children,
}: PropsWithChildren<{
  params: AddOwnerFlowProps | ReplaceOwnerFlowProps
  onSubmit?: () => void
}>) => {
  const dispatch = useAppDispatch()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()
  const { chainId } = safe
  const chain = useCurrentChain()
  const { newOwner, removedOwner, threshold } = params

  const currentOwners = useMemo(() => safe.owners.map((o) => o.value), [safe.owners])

  const change: OwnerChange = useMemo(() => {
    if (removedOwner) {
      return { type: 'swapOwner', oldOwnerAddress: removedOwner.address, newOwnerAddress: newOwner.address }
    }
    return { type: 'addOwner', ownerAddress: newOwner.address, threshold }
  }, [removedOwner, newOwner.address, threshold])

  const projected = useMemo(
    () => computeProjectedState(currentOwners, safe.threshold, change),
    [currentOwners, safe.threshold, change],
  )

  useSafeShieldForDeadlockCheck(safe.address.value, projected.owners, projected.threshold)

  useEffect(() => {
    if (!chain) return

    const promise = removedOwner
      ? createSwapOwnerTx(chain, safe.deployed, {
          newOwnerAddress: newOwner.address,
          oldOwnerAddress: removedOwner.address,
        })
      : createAddOwnerTx(chain, safe.deployed, {
          ownerAddress: newOwner.address,
          threshold,
        })

    promise.then(setSafeTx).catch(setSafeTxError)
  }, [removedOwner, newOwner, threshold, setSafeTx, setSafeTxError, chain, safe.deployed])

  const addAddressBookEntry = () => {
    if (typeof newOwner.name !== 'undefined') {
      dispatch(
        upsertAddressBookEntries({
          chainIds: [chainId],
          address: newOwner.address,
          name: newOwner.name,
        }),
      )
    }

    trackEvent({ ...SETTINGS_EVENTS.SETUP.THRESHOLD, label: safe.threshold })
    trackEvent({ ...SETTINGS_EVENTS.SETUP.OWNERS, label: safe.owners.length })
  }

  const handleSubmit = () => {
    addAddressBookEntry()
    onSubmit?.()
  }

  return (
    <SettingsChangeContext.Provider value={params}>
      <ReviewTransaction onSubmit={handleSubmit}>{children}</ReviewTransaction>
    </SettingsChangeContext.Provider>
  )
}
