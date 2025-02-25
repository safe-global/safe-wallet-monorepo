import { useContext } from 'react'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { Button } from '@mui/material'
import ArrowIconNW from '@/public/images/common/arrow-top-right.svg'
import CheckWallet from '@/components/common/CheckWallet'
import useSpendingLimit from '@/hooks/useSpendingLimit'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics/events/assets'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'

const SendButton = ({ tokenInfo, isOutlined }: { tokenInfo: TokenInfo; isOutlined?: boolean }) => {
  const spendingLimit = useSpendingLimit(tokenInfo)
  const { setTxFlow } = useContext(TxModalContext)

  const onSendClick = () => {
    setTxFlow(<TokenTransferFlow tokenAddress={tokenInfo.address} />)
  }

  return (
    <CheckWallet allowSpendingLimit={!!spendingLimit}>
      {(isOk) => (
        <Track {...ASSETS_EVENTS.SEND}>
          <Button
            data-testid="send-button"
            variant={isOutlined ? 'outlined' : 'contained'}
            color="primary"
            size="small"
            startIcon={<ArrowIconNW />}
            onClick={onSendClick}
            disabled={!isOk}
            sx={{ height: '37.5px' }}
          >
            Send
          </Button>
        </Track>
      )}
    </CheckWallet>
  )
}

export default SendButton
