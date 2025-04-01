import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SvgIcon,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import TxCard from '@/components/tx-flow/common/TxCard'
import InfoIcon from '@/public/images/notifications/info.svg'
import SignatureIcon from '@/public/images/transactions/signature.svg'

import css from './styles.module.css'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'

export const SignerForm = ({ willExecute }: { willExecute?: boolean }) => {
  const { signer, setSignerAddress, connectedWallet: wallet } = useWalletContext() ?? {}
  const nestedSafeOwners = useNestedSafeOwners()
  const signerAddress = signer?.address
  const { safe } = useSafeInfo()
  const { safeTx } = useContext(SafeTxContext)
  const isNestedOwner = useIsNestedSafeOwner()

  const onChange = (event: SelectChangeEvent<string>) => {
    trackEvent(MODALS_EVENTS.CHANGE_SIGNER)
    setSignerAddress?.(event.target.value)
  }

  const isOptionEnabled = useCallback(
    (address: string) => {
      if (!safeTx) {
        return true
      }

      if (safeTx.signatures.size < safe.threshold) {
        const signers = Array.from(safeTx.signatures.keys())
        return !signers.some((key) => sameAddress(key, address))
      }

      return true
    },
    [safeTx, safe.threshold],
  )

  const options = useMemo(() => {
    if (!wallet) {
      return []
    }
    const isFullySigned = safeTx ? safeTx.signatures.size >= safe.threshold : false

    // No nested execution for fully signed transactions
    if (isFullySigned && willExecute) {
      return [wallet.address]
    }

    const owners = new Set(nestedSafeOwners ?? [])

    if (safe.owners.some((owner) => sameAddress(owner.value, wallet.address))) {
      owners.add(wallet.address)
    }

    return Array.from(owners)
  }, [nestedSafeOwners, safe.owners, safe.threshold, safeTx, wallet, willExecute])

  // Select first option if no signer is selected and the connected wallet cannot sign
  useEffect(() => {
    const isValidSigner = signerAddress && options.includes(signerAddress) && isOptionEnabled(signerAddress)
    if (isValidSigner || !setSignerAddress || !wallet) {
      return
    }

    const enabledOptions = options.filter(isOptionEnabled)
    if (enabledOptions.length > 0 && !enabledOptions.includes(wallet.address)) {
      setSignerAddress(enabledOptions[0])
    }
  }, [isOptionEnabled, options, setSignerAddress, signerAddress, wallet])

  if (!wallet || !isNestedOwner || (options.length === 1 && options[0] === wallet.address)) {
    return null
  }

  return (
    <TxCard>
      <Typography variant="h5" display="flex" gap={1} alignItems="center">
        <SvgIcon component={SignatureIcon} inheritViewBox fontSize="small" />
        {willExecute ? 'Execute' : 'Sign'} with
        <Tooltip
          title={`Your connected wallet controls other Safe Accounts, which can sign this transaction. You can select which Account to ${
            willExecute ? 'execute' : 'sign'
          } with.`}
          arrow
          placement="top"
        >
          <SvgIcon component={InfoIcon} inheritViewBox color="border" fontSize="small" />
        </Tooltip>
      </Typography>

      <Box display="flex" alignItems="center" gap={1}>
        <FormControl fullWidth size="medium">
          <InputLabel id="signer-label">Signer Account</InputLabel>
          <Select
            className={css.signerForm}
            labelId="signer-label"
            label="Signer account"
            fullWidth
            onChange={onChange}
            value={signerAddress}
          >
            {options?.map((owner) => (
              <MenuItem key={owner} value={owner} disabled={!isOptionEnabled(owner)}>
                <EthHashInfo address={owner} avatarSize={32} onlyName copyAddress={false} />
                {!isOptionEnabled(owner) && (
                  <Typography variant="caption" component="span" className={css.disabledPill}>
                    Already signed
                  </Typography>
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </TxCard>
  )
}
