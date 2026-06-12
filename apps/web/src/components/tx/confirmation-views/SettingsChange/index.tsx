import type { SettingsChangeTransaction as SettingsChangeType } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SettingsInfoType } from '@safe-global/store/gateway/types'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { NarrowConfirmationViewProps } from '../types'
import { OwnerList } from '@/components/tx-flow/common/OwnerList'
import MinusIcon from '@/public/images/common/minus.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChangeSignerSetupWarning } from '@/features/multichain'
import { useContext } from 'react'
import { SettingsChangeContext } from '@/components/tx-flow/flows/AddOwner/context'
import { maybePlural } from '@safe-global/utils/utils/formatters'

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

  return (
    <>
      {'oldOwner' in settingsInfo && (
        <div className="rounded-lg bg-[var(--color-warning-background)] p-4">
          <div className="text-muted-foreground mb-4 flex items-center">
            <MinusIcon className="mr-2 size-4" />
            Previous signer
          </div>
          <EthHashInfo
            name={settingsInfo.oldOwner.name}
            address={settingsInfo.oldOwner.value}
            shortAddress={false}
            showCopyButton
            hasExplorer
          />
        </div>
      )}

      {'owner' in settingsInfo && !hasNewOwner && <OwnerList owners={[settingsInfo.owner]} />}
      {hasNewOwner && <OwnerList owners={[{ name: params.newOwner.name, value: params.newOwner.address }]} />}

      {shouldShowChangeSigner && <ChangeSignerSetupWarning />}

      {'threshold' in settingsInfo && (
        <>
          <Separator className={commonCss.nestedDivider} />

          <div>
            <Typography variant="paragraph-small">Any transaction requires the confirmation of:</Typography>
            <Typography>
              <b>{settingsInfo.threshold}</b> out of{' '}
              <b>
                {newSignersLength} signer{maybePlural(newSignersLength)}
              </b>
            </Typography>
          </div>
        </>
      )}
      <Separator className={commonCss.nestedDivider} />
    </>
  )
}

export default SettingsChange
