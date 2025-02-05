import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveSafe, setActiveSafe } from '@/src/store/activeSafeSlice'
import { Address } from '@/src/types/address'
import { AppSettings } from './AppSettings'

export const AppSettingsContainer = () => {
  const dispatch = useDispatch()
  const activeSafe = useSelector(selectActiveSafe)
  const [safeAddress, setSafeAddress] = useState('')

  const handleSubmit = () => {
    if (!activeSafe) {
      return
    }
    dispatch(
      setActiveSafe({
        chainId: activeSafe.chainId,
        address: safeAddress as Address,
      }),
    )
  }
  return <AppSettings onSubmit={handleSubmit} address={safeAddress} onAddressChange={setSafeAddress} />
}
