import React from 'react'
import { LargeHeaderTitle, NavBarTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'
import { Container } from '@/src/components/Container'
import { FETCH_STATUS, TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'
import { Linking } from 'react-native'
import { View, ScrollView, Text, XStack, YStack } from 'tamagui'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { CircleSnail } from 'react-native-progress'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SecurityResponse } from '@safe-global/utils/services/security/modules/types'
import { BlockaidModuleResponse } from '@safe-global/utils/services/security/modules/BlockaidModule'
import { BlockaidBalanceChanges } from './blockaid/balance/BlockaidBalanceChanges'
import { BlockaidWarning } from './blockaid/scans/BlockaidWarning'
import { InfoSheet } from '@/src/components/InfoSheet'

type Props = {
  tenderly: {
    enabled: boolean
    fetchStatus: FETCH_STATUS
    simulationLink: string
    simulation?: TenderlySimulation
  }
  blockaid: {
    enabled: boolean
    loading: boolean
    error?: Error
    payload?: SecurityResponse<BlockaidModuleResponse>
  }
}

export const TransactionChecksView = ({ tenderly, blockaid }: Props) => {
  const { enabled, fetchStatus } = tenderly
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle>Transaction checks</NavBarTitle>,
  })

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: '$4', paddingTop: '$3' }} onScroll={handleScroll}>
      <View>
        <LargeHeaderTitle marginBottom={'$5'}>Transaction checks</LargeHeaderTitle>
      </View>
      <YStack gap={'$4'}>
        <Container gap={'$3'}>
          {blockaid.enabled ? (
            <BlockaidBalanceChanges blockaidResponse={blockaid.payload} fetchStatusLoading={blockaid.loading} />
          ) : (
            <Text>Security check is disabled</Text>
          )}
        </Container>
        <Container gap={'$3'}>
          {enabled ? (
            <>
              <XStack justifyContent="space-between">
                <XStack gap={'$2'}>
                  <Text fontWeight={600}>Transaction simulation</Text>
                  <InfoSheet
                    title="Simulation"
                    info="The transaction can be simulated before execution to ensure that it will succeed. You can view a full detailed report on Tenderly."
                  />
                </XStack>

                {fetchStatus === FETCH_STATUS.LOADING ? (
                  <Badge
                    circular={false}
                    content={
                      <XStack gap={'$2'} justifyContent="center" alignItems="center">
                        <CircleSnail size={12} borderWidth={0} thickness={1} />
                        <Text fontSize={12}>Loading</Text>
                      </XStack>
                    }
                  />
                ) : tenderly.simulation?.simulation.status ? (
                  <Badge
                    circular={false}
                    themeName="badge_success_variant1"
                    content={
                      <XStack gap={'$2'} justifyContent="center" alignItems="center">
                        <SafeFontIcon name="check-filled" size={12} />
                        <Text fontSize={12}>Success</Text>
                      </XStack>
                    }
                  />
                ) : (
                  <Badge circular={false} themeName="badge_error" content={<Text fontSize={12}>Failed</Text>} />
                )}
              </XStack>
              {tenderly.fetchStatus === FETCH_STATUS.SUCCESS && (
                <SafeButton
                  secondary
                  onPress={() => {
                    Linking.openURL(tenderly.simulationLink)
                  }}
                >
                  View details on Tenderly
                </SafeButton>
              )}
              {tenderly.fetchStatus === FETCH_STATUS.LOADING && (
                <XStack gap={'$2'}>
                  <CircleSnail size={16} borderWidth={0} thickness={1} />
                  <Text>Simulating with Tenderly...</Text>
                </XStack>
              )}
              {tenderly.fetchStatus === FETCH_STATUS.ERROR && <Text>Error</Text>}
            </>
          ) : (
            <Text>Transaction simulation is disabled</Text>
          )}
        </Container>

        {blockaid.enabled && <BlockaidWarning blockaidResponse={blockaid.payload} />}
      </YStack>
    </ScrollView>
  )
}
