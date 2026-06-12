import { useContext } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
            <Tooltip>
              <TooltipTrigger
                render={
                  <span>
                    <Button
                      variant="ghost"
                      data-testid="send-button"
                      onClick={onSendClick}
                      disabled={!isOk}
                      aria-label="Send"
                      className={`size-7 min-w-7 p-1.5 ${css.assetActionIconButton}`}
                    >
                      <ArrowIconNW />
                    </Button>
                  </span>
                }
              />
              {isOk && <TooltipContent>Send</TooltipContent>}
            </Tooltip>
          ) : (
            <Button
              data-testid="send-button"
              variant={light ? 'secondary' : 'default'}
              onClick={onSendClick}
              disabled={!isOk}
              className={`h-8 ${css.sendButton}`}
            >
              <ArrowIconNW />
              Send
            </Button>
          )}
        </Track>
      )}
    </CheckWallet>
  )
}

export default SendButton
