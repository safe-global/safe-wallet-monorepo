import { useContext } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Button, IconButton, Tooltip, SvgIcon } from '@mui/material'
import ArrowIconNW from '@/public/images/common/arrow-up-right.svg'
import CheckWallet from '@/components/common/CheckWallet'
import { useSpendingLimit } from '@/features/spending-limits'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics/events/assets'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'
import css from '@/components/common/AssetActionButton/styles.module.css'

const SendButton = ({
  tokenInfo,
  light,
  onlyIcon = false,
}: {
  tokenInfo: Balance['tokenInfo']
  light?: boolean
  onlyIcon?: boolean
}) => {
  const spendingLimit = useSpendingLimit(tokenInfo)
  const { setTxFlow } = useContext(TxModalContext)

  const onSendClick = () => {
    setTxFlow(<TokenTransferFlow recipients={[{ tokenAddress: tokenInfo.address }]} />)
  }

  return (
    <CheckWallet allowSpendingLimit={!!spendingLimit}>
      {(isOk) => (
        <Track {...ASSETS_EVENTS.SEND}>
          {onlyIcon ? (
            <Tooltip title={isOk ? 'Send' : ''} placement="top" arrow>
              <span>
                <IconButton
                  data-testid="send-button"
                  onClick={onSendClick}
                  disabled={!isOk}
                  size="small"
                  aria-label="Send"
                  className={css.assetActionIconButton}
                >
                  <SvgIcon component={ArrowIconNW} inheritViewBox />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Button
              data-testid="send-button"
              variant="contained"
              color={light ? 'background.paper' : 'primary'}
              size="medium"
              startIcon={<ArrowIconNW />}
              onClick={onSendClick}
              disabled={!isOk}
              className={css.sendButton}
            >
              Send
            </Button>
          )}
        </Track>
      )}
    </CheckWallet>
  )
}

export default SendButton
