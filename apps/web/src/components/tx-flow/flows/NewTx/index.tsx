import { useCallback, useContext } from 'react'
import { MakeASwapButton, SendTokensButton, TxBuilderButton } from '@/components/tx-flow/common/TxButton'
import { TxModalContext } from '../../'
import TokenTransferFlow from '../TokenTransfer'
import ChainIndicator from '@/components/common/ChainIndicator'
import { useDarkMode } from '@/hooks/useDarkMode'
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'
import { NewTxView } from '@views/components/tx-flow/flows/NewTx/NewTxView'

const NewTxFlow = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const { HnMiniTxBanner } = useLoadFeature(HypernativeFeature)
  const isDarkMode = useDarkMode()

  const onTokensClick = useCallback(() => {
    setTxFlow(<TokenTransferFlow />)
  }, [setTxFlow])

  const progress = 10

  return (
    <NewTxView
      progress={progress}
      isDarkMode={isDarkMode}
      renderChainIndicator={(props) => <ChainIndicator {...props} />}
      hnBanner={<HnMiniTxBanner />}
      sendTokensButton={<SendTokensButton onClick={onTokensClick} />}
      swapButton={<MakeASwapButton />}
      txBuilderButton={<TxBuilderButton />}
    />
  )
}

export default NewTxFlow
