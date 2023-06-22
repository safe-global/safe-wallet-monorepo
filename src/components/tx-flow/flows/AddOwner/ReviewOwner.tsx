import { useContext, useEffect } from 'react'
import { Typography, Divider, Box, SvgIcon, Paper } from '@mui/material'

import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import useAddressBook from '@/hooks/useAddressBook'
import useSafeInfo from '@/hooks/useSafeInfo'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createSwapOwnerTx, createAddOwnerTx } from '@/services/tx/tx-sender'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntry } from '@/store/addressBookSlice'
import { SafeTxContext } from '../../SafeTxProvider'
import type { AddOwnerFlowProps } from '.'
import type { ReplaceOwnerFlowProps } from '../ReplaceOwner'
import PlusIcon from '@/public/images/common/plus.svg'
import MinusIcon from '@/public/images/common/minus.svg'
import EthHashInfo from '@/components/common/EthHashInfo'
import commonCss from '@/components/tx-flow/common/styles.module.css'

export const ReviewOwner = ({ params }: { params: AddOwnerFlowProps | ReplaceOwnerFlowProps }) => {
  const dispatch = useAppDispatch()
  const addressBook = useAddressBook()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe, safeAddress } = useSafeInfo()
  const { chainId } = safe
  const { newOwner, removedOwner, threshold } = params

  useEffect(() => {
    const promise = removedOwner
      ? createSwapOwnerTx({
          newOwnerAddress: newOwner.address,
          oldOwnerAddress: removedOwner.address,
        })
      : createAddOwnerTx({
          ownerAddress: newOwner.address,
          threshold,
        })

    promise.then(setSafeTx).catch(setSafeTxError)
  }, [removedOwner, newOwner, threshold, setSafeTx, setSafeTxError])

  const addAddressBookEntryAndSubmit = () => {
    if (typeof newOwner.name !== 'undefined') {
      dispatch(
        upsertAddressBookEntry({
          chainId: chainId,
          address: newOwner.address,
          name: newOwner.name,
        }),
      )
    }

    trackEvent({ ...SETTINGS_EVENTS.SETUP.THRESHOLD, label: safe.threshold })
    trackEvent({ ...SETTINGS_EVENTS.SETUP.OWNERS, label: safe.owners.length })
  }

  return (
    <SignOrExecuteForm onSubmit={addAddressBookEntryAndSubmit}>
      <div>
        <Typography variant="body2" color="text.secondary" mb={0.5}>
          Selected Safe Account
        </Typography>
        <Paper sx={{ backgroundColor: ({ palette }) => palette.background.main, p: '12px' }}>
          <EthHashInfo name={addressBook[safeAddress]} address={safeAddress} shortAddress={false} />
        </Paper>
      </div>
      {params.removedOwner && (
        <>
          <Box display="flex" alignItems="center" gap={2} mx="auto">
            <SvgIcon component={MinusIcon} inheritViewBox fontSize="small" />
            Remove owner
          </Box>

          <div>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Previous owner
            </Typography>
            <Paper sx={{ backgroundColor: ({ palette }) => palette.warning.background, p: '12px' }}>
              <EthHashInfo
                name={params.removedOwner.name}
                address={params.removedOwner.address}
                shortAddress={false}
                showCopyButton
                hasExplorer
              />
            </Paper>
          </div>
        </>
      )}
      <Box display="flex" alignItems="center" gap={2} mx="auto">
        <SvgIcon component={PlusIcon} inheritViewBox fontSize="small" />
        Add new owner
      </Box>
      <div>
        <Typography variant="body2" color="text.secondary" mb={0.5}>
          New owner
        </Typography>
        <Paper sx={{ backgroundColor: ({ palette }) => palette.info.background, p: '12px' }}>
          <EthHashInfo
            name={newOwner.name}
            address={newOwner.address}
            shortAddress={false}
            showCopyButton
            hasExplorer
          />
        </Paper>
      </div>
      <Divider className={commonCss.nestedDivider} />
      <Box>
        <Typography variant="body2">Any transaction requires the confirmation of:</Typography>
        <Typography>
          <b>{threshold}</b> out of <b>{safe.owners.length + (removedOwner ? 0 : 1)} owners</b>
        </Typography>
      </Box>
      <Divider className={commonCss.nestedDivider} />
    </SignOrExecuteForm>
  )
}
