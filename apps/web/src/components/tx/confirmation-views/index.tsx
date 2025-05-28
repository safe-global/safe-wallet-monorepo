import type { TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction } from '@safe-global/types-kit'
import {
  isAnyStakingTxInfo,
  isCustomTxInfo,
  isExecTxData,
  isOnChainConfirmationTxData,
  isOnChainSignMessageTxData,
  isSafeMigrationTxData,
  isSafeUpdateTxData,
  isSwapOrderTxInfo,
  isTwapOrderTxInfo,
  isVaultDepositTxInfo,
  isVaultRedeemTxInfo,
} from '@/utils/transaction-guards'
import { type ReactNode, useContext, useMemo, useRef, useState, useEffect } from 'react'
import type { NarrowConfirmationViewProps } from './types'
import SettingsChange from './SettingsChange'
import ChangeThreshold from './ChangeThreshold'
import BatchTransactions from './BatchTransactions'
import { TxModalContext } from '@/components/tx-flow'
import { isSettingsChangeView, isChangeThresholdView, isConfirmBatchView, isManageSignersView } from './utils'
import { OnChainConfirmation } from '@/components/transactions/TxDetails/TxData/NestedTransaction/OnChainConfirmation'
import { ExecTransaction } from '@/components/transactions/TxDetails/TxData/NestedTransaction/ExecTransaction'
import { type ReactElement } from 'react'
import SwapOrder from './SwapOrder'
import StakingTx from './StakingTx'
import UpdateSafe from './UpdateSafe'
import { MigrateToL2Information } from './MigrateToL2Information'
import { NestedSafeCreation } from './NestedSafeCreation'
import { isNestedSafeCreation } from '@/utils/nested-safes'
import VaultDepositConfirmation from 'src/features/earn/components/VaultDepositConfirmation'
import VaultRedeemConfirmation from '@/features/earn/components/VaultRedeemConfirmation'
import Summary from '@/components/transactions/TxDetails/Summary'
import TxData from '@/components/transactions/TxDetails/TxData'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import useChainId from '@/hooks/useChainId'
import { ManageSigners } from './ManageSigners'
import { TransactionWarnings } from '../TransactionWarnings'
import { Box } from '@mui/material'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'

type ConfirmationViewProps = {
  txDetails?: TransactionDetails
  txPreview?: TransactionPreview
  safeTx?: SafeTransaction
  isBatch?: boolean
  isApproval?: boolean
  isCreation?: boolean
  children?: ReactNode
  withDecodedData?: boolean
}

const getConfirmationViewComponent = ({
  txInfo,
  txData,
  txFlow,
}: NarrowConfirmationViewProps & { txFlow?: ReactElement }) => {
  if (txData && isManageSignersView(txInfo, txData)) return <ManageSigners txInfo={txInfo} txData={txData} />

  if (isChangeThresholdView(txInfo)) return <ChangeThreshold txInfo={txInfo} />

  if (isConfirmBatchView(txFlow)) return <BatchTransactions />

  if (isSettingsChangeView(txInfo)) return <SettingsChange txInfo={txInfo} />

  if (isOnChainConfirmationTxData(txData)) return <OnChainConfirmation data={txData} isConfirmationView />

  if (isExecTxData(txData)) return <ExecTransaction data={txData} isConfirmationView />

  if (isSwapOrderTxInfo(txInfo) || isTwapOrderTxInfo(txInfo)) return <SwapOrder txInfo={txInfo} txData={txData} />

  if (isAnyStakingTxInfo(txInfo)) return <StakingTx txInfo={txInfo} />

  // @ts-expect-error TODO: Fix these if there is time
  if (isVaultDepositTxInfo(txInfo)) return <VaultDepositConfirmation txInfo={txInfo} />

  // @ts-expect-error TODO: Fix these if there is time
  if (isVaultRedeemTxInfo(txInfo)) return <VaultRedeemConfirmation txInfo={txInfo} />

  if (isCustomTxInfo(txInfo) && isSafeUpdateTxData(txData)) return <UpdateSafe txData={txData} />

  if (isCustomTxInfo(txInfo) && isSafeMigrationTxData(txData)) {
    return <MigrateToL2Information variant="queue" txData={txData} />
  }

  if (isCustomTxInfo(txInfo) && txData && isNestedSafeCreation(txData)) {
    return <NestedSafeCreation txData={txData} />
  }

  return null
}

const ConfirmationView = ({
  safeTx,
  txPreview,
  txDetails,
  withDecodedData = true,
  ...props
}: ConfirmationViewProps) => {
  const { txFlow } = useContext(TxModalContext)
  const details = txDetails ?? txPreview
  const chainId = useChainId()

  // Used to check if the decoded data was rendered inside the TxData component
  // If it was, we hide the decoded data in the Summary to avoid showing it twice
  const decodedDataRef = useRef(null)
  const [isDecodedDataVisible, setIsDecodedDataVisible] = useState(false)

  useEffect(() => {
    // If decodedDataRef.current is not null, the decoded data was rendered inside the TxData component
    setIsDecodedDataVisible(!!decodedDataRef.current)
  }, [])

  const ConfirmationViewComponent = useMemo(() => {
    return details
      ? getConfirmationViewComponent({
          txInfo: details.txInfo,
          txData: details.txData,
          txFlow,
        })
      : undefined
  }, [details, txFlow])

  const showTxDetails =
    details !== undefined &&
    !isMultiSendCalldata(details.txData?.hexData ?? '0x') &&
    !isOnChainSignMessageTxData(details?.txData, chainId)

  return (
    <>
      <TransactionWarnings txData={details?.txData} />
      {withDecodedData &&
        (ConfirmationViewComponent ||
          (details && showTxDetails && (
            <TxData txData={details?.txData} txInfo={details?.txInfo} txDetails={txDetails} imitation={false} trusted>
              <Box ref={decodedDataRef}>
                <DecodedData
                  txData={details.txData}
                  toInfo={isCustomTxInfo(details.txInfo) ? details.txInfo.to : details.txData?.to}
                />
              </Box>
            </TxData>
          )))}

      {props.children}

      <Summary
        safeTxData={safeTx?.data}
        txDetails={txDetails}
        txData={details?.txData}
        txInfo={details?.txInfo}
        showDecodedData={!isDecodedDataVisible}
      />
    </>
  )
}

export default ConfirmationView
