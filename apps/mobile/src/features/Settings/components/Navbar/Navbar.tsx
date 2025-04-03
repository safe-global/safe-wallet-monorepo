import React from 'react'
import { SettingsMenu } from '@/src/features/Settings/components/Navbar/SettingsMenu'
import { Address } from '@/src/types/address'

export const Navbar = (props: { safeAddress: Address }) => {
  const { safeAddress } = props

  return <SettingsMenu safeAddress={safeAddress} />
}
