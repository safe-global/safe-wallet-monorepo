import type {
  ChangeThreshold,
  SettingsChange,
  TransactionDetails,
  TransactionInfo,
} from '@safe-global/safe-gateway-typescript-sdk'
import { SettingsInfoType, TransactionInfoType } from '@safe-global/safe-gateway-typescript-sdk'
import { ConfirmBatchFlow } from '@/components/tx-flow/flows'
import { isMultiSendTxInfo } from '@/utils/transaction-guards'
import {
  isAddOwnerWithThresholdCalldata,
  isChangeThresholdCalldata,
  isRemoveOwnerCalldata,
  isSwapOwnerCalldata,
} from '@/utils/transaction-calldata'
import { type ReactElement } from 'react'

const MANAGE_SIGNERS_SETTING_INFO_TYPES = [
  SettingsInfoType.ADD_OWNER,
  SettingsInfoType.REMOVE_OWNER,
  SettingsInfoType.SWAP_OWNER,
  SettingsInfoType.CHANGE_THRESHOLD,
]

const MANAGE_SIGNERS_CALLDATA_GUARDS = [
  isAddOwnerWithThresholdCalldata,
  isRemoveOwnerCalldata,
  isSwapOwnerCalldata,
  isChangeThresholdCalldata,
]

export function isManageSignersView(txInfo: TransactionInfo, txData: TransactionDetails['txData']): boolean {
  if (txInfo.type === TransactionInfoType.SETTINGS_CHANGE) {
    return !!txInfo.settingsInfo && MANAGE_SIGNERS_SETTING_INFO_TYPES.includes(txInfo.settingsInfo.type)
  }

  if (isMultiSendTxInfo(txInfo) && txData?.dataDecoded?.parameters?.[0]?.valueDecoded) {
    return txData.dataDecoded.parameters[0].valueDecoded.every(({ data }) => {
      return data && MANAGE_SIGNERS_CALLDATA_GUARDS.some((guard) => guard(data))
    })
  }

  return false
}

export const isSettingsChangeView = (txInfo: TransactionInfo): txInfo is SettingsChange =>
  txInfo.type === TransactionInfoType.SETTINGS_CHANGE &&
  txInfo.settingsInfo?.type !== SettingsInfoType.SET_FALLBACK_HANDLER

export const isConfirmBatchView = (txFlow?: ReactElement) => txFlow?.type === ConfirmBatchFlow

export const isChangeThresholdView = (
  txInfo: TransactionInfo,
): txInfo is SettingsChange & { settingsInfo: ChangeThreshold } =>
  txInfo.type === TransactionInfoType.SETTINGS_CHANGE && txInfo.settingsInfo?.type === SettingsInfoType.CHANGE_THRESHOLD
