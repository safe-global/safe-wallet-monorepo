import { Paper, Typography, Box, Divider, SvgIcon } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { NarrowConfirmationViewProps } from '../types'
import { OwnerList } from '@/components/tx-flow/common/OwnerList'
import MinusIcon from '@/public/images/common/minus.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import { SettingsInfoType, type SettingsChange as SettingsChangeType } from '@safe-global/safe-gateway-typescript-sdk'
import { ChangeSignerSetupWarning } from '@/features/multichain/components/SignerSetupWarning/ChangeSignerSetupWarning'
import { useContext } from 'react'
import { SettingsChangeContext } from '@/components/tx-flow/flows/AddOwner/context'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { UntrustedFallbackHandlerTxAlert } from '@/components/tx/confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert'

export interface SettingsChangeProps extends NarrowConfirmationViewProps {
  txInfo: SettingsChangeType
}

const SettingsChange: React.FC<SettingsChangeProps> = ({ txInfo: { settingsInfo } }) => {
  const { safe } = useSafeInfo()
  const params = useContext(SettingsChangeContext)

  if (!settingsInfo || settingsInfo.type === SettingsInfoType.REMOVE_OWNER) return null

  const shouldShowChangeSigner = 'owner' in settingsInfo || 'newOwner' in params
  const hasNewOwner = 'newOwner' in params
  const newSignersLength = safe.owners.length + ('removedOwner' in settingsInfo ? 0 : 1)
  const setsFallbackHandler = settingsInfo.type === SettingsInfoType.SET_FALLBACK_HANDLER

  return (
    <>
      {setsFallbackHandler && <UntrustedFallbackHandlerTxAlert fallbackHandler={settingsInfo.handler.value} />}

      {'oldOwner' in settingsInfo && (
        <Paper sx={{ backgroundColor: ({ palette }) => palette.warning.background, p: 2 }}>
          <Typography color="text.secondary" mb={2} display="flex" alignItems="center">
            <SvgIcon component={MinusIcon} inheritViewBox fontSize="small" sx={{ mr: 1 }} />
            Previous signer
          </Typography>
          <EthHashInfo
            name={settingsInfo.oldOwner.name}
            address={settingsInfo.oldOwner.value}
            shortAddress={false}
            showCopyButton
            hasExplorer
          />
        </Paper>
      )}

      {'owner' in settingsInfo && !hasNewOwner && <OwnerList owners={[settingsInfo.owner]} />}
      {hasNewOwner && <OwnerList owners={[{ name: params.newOwner.name, value: params.newOwner.address }]} />}

      {shouldShowChangeSigner && <ChangeSignerSetupWarning />}

      {'threshold' in settingsInfo && (
        <>
          <Divider className={commonCss.nestedDivider} />

          <Box>
            <Typography variant="body2">Any transaction requires the confirmation of:</Typography>
            <Typography>
              <b>{settingsInfo.threshold}</b> out of{' '}
              <b>
                {newSignersLength} signer{maybePlural(newSignersLength)}
              </b>
            </Typography>
          </Box>
        </>
      )}
      <Divider className={commonCss.nestedDivider} />
    </>
  )
}

export default SettingsChange
