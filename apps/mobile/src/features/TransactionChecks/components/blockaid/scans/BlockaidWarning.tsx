import React from 'react'
import { View, YStack } from 'tamagui'
import { SecuritySeverity } from '@safe-global/utils/services/security/modules/types'
import { BlockaidModuleResponse } from '@safe-global/utils/services/security/modules/BlockaidModule'
import { BlockaidMessage } from './BlockaidMessage'
import { ContractChangeWarning } from './ContractChangeWarning'
import { PoweredByBlockaid } from '../PoweredByBlockaid'
import { Alert, AlertType } from '@/src/components/Alert'
import { BlockaidError } from '@/src/features/TransactionChecks/components/blockaid/scans/BlockaidError'
import { ResultDescription } from '@/src/features/TransactionChecks/components/blockaid/ResultDescription'

type BlockaidWarningProps = {
  blockaidResponse?: {
    severity?: SecuritySeverity
    isLoading?: boolean
    error?: Error
    payload?: BlockaidModuleResponse
  }
}

export const BlockaidWarning = ({ blockaidResponse }: BlockaidWarningProps) => {
  const { severity, isLoading, error, payload } = blockaidResponse ?? {}

  if (error) {
    return <BlockaidError />
  }

  if (isLoading || !blockaidResponse) {
    return null
  }
  let type = 'success'

  if (severity === SecuritySeverity.HIGH) {
    type = 'error'
  } else if (severity === SecuritySeverity.MEDIUM) {
    type = 'warning'
  }
  return (
    <YStack gap="$3">
      {blockaidResponse.severity ? (
        <View>
          <Alert
            type={type as AlertType}
            message={
              <ResultDescription
                classification={payload?.classification}
                reason={payload?.reason}
                description={payload?.description}
              />
            }
            info={
              <>
                <BlockaidMessage blockaidResponse={blockaidResponse} />
                <PoweredByBlockaid />
              </>
            }
          />
        </View>
      ) : payload?.contractManagement && payload.contractManagement.length > 0 ? (
        <View>
          <YStack gap="$2">
            {payload.contractManagement.map((contractChange) => (
              <ContractChangeWarning key={contractChange.type} contractChange={contractChange} />
            ))}
          </YStack>
          <PoweredByBlockaid />
        </View>
      ) : null}
    </YStack>
  )
}
