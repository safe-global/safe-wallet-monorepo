import React from 'react'
import { LargeHeaderTitle, NavBarTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'
import { Container } from '@/src/components/Container'
import { FETCH_STATUS, TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'
import { Linking } from 'react-native'
import { View, ScrollView, Text, XStack } from 'tamagui'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { CircleSnail } from 'react-native-progress'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

type Props = {
  tenderly: {
    enabled: boolean
  } & (
    | {
        enabled: true
        fetchStatus: FETCH_STATUS
        simulationLink: string
        simulation?: TenderlySimulation
      }
    | {
        enabled: false
      }
  )
}
export const TransactionChecksView = ({ tenderly }: Props) => {
  const { enabled } = tenderly
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle>Transaction checks</NavBarTitle>,
  })

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: '$4', paddingTop: '$3' }} onScroll={handleScroll}>
      <View>
        <LargeHeaderTitle marginBottom={'$5'}>Transaction checks</LargeHeaderTitle>
      </View>
      <Container gap={'$3'}>
        {enabled ? (
          <>
            <XStack justifyContent="space-between">
              <Text fontWeight={600}>Transaction simulation</Text>
              {tenderly?.simulation?.simulation.status && (
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
    </ScrollView>
  )
}
