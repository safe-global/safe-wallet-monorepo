import { useContext } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import CheckWallet from '@/components/common/CheckWallet'
import { useSpendingLimit } from '@/features/spending-limits'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'
import { SendButtonView } from '@views/components/balances/AssetsTable/SendButtonView'

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
      {(isOk) => <SendButtonView isOk={isOk} onClick={onSendClick} light={light} onlyIcon={onlyIcon} />}
    </CheckWallet>
  )
}

export default SendButton
