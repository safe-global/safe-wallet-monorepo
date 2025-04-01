import { SvgIcon, Typography } from '@mui/material'
import { getSafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useState, useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import { isAddress } from 'ethers'
import type { ReactElement } from 'react'

import InfoIcon from '@/public/images/notifications/info.svg'
import { isSmartContractWallet } from '@/utils/wallets'
import useDebounce from '@/hooks/useDebounce'
import useSafeInfo from '@/hooks/useSafeInfo'
import { UpsertRecoveryFlowFields } from '.'
import { sameAddress } from '@safe-global/utils/utils/addresses'

import addressBookInputCss from '@/components/common/AddressBookInput/styles.module.css'

export function RecovererWarning(): ReactElement | null {
  const { safe, safeAddress } = useSafeInfo()
  const [warning, setWarning] = useState<string>()

  const recoverer = useWatch({ name: UpsertRecoveryFlowFields.recoverer })
  const debouncedRecoverer = useDebounce(recoverer, 500)

  useEffect(() => {
    setWarning(undefined)

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
        await getSafeInfo(safe.chainId, debouncedRecoverer)
      } catch {
        setWarning('The given address is a smart contract. Please ensure that it can sign transactions.')
      }
    })()
  }, [debouncedRecoverer, safe.chainId, safeAddress])

  if (!warning) {
    return null
  }

  return (
    <Typography
      variant="body2"
      className={addressBookInputCss.unknownAddress}
      sx={({ palette }) => ({
        bgcolor: `${palette.warning.background} !important`,
        color: `${palette.warning.main} !important`,
      })}
    >
      <SvgIcon component={InfoIcon} fontSize="small" />
      {warning}
    </Typography>
  )
}
