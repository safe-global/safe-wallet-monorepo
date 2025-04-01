import React from 'react'
import { View, XStack, Text } from 'tamagui'

import { DropdownLabel } from '@/src/components/Dropdown'
import { Fiat } from '@/src/components/Fiat'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import { ChainsDisplay } from '@/src/components/ChainsDisplay'
import { useRouter } from 'expo-router'
import { shouldDisplayPreciseBalance } from '@/src/utils/balance'
import { TouchableOpacity, useColorScheme } from 'react-native'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Skeleton } from 'moti/skeleton'

interface BalanceProps {
  activeChainId: string
  safeAddress: string
  isLoading: boolean
  chains: Chain[]
  balanceAmount: string
  chainName: string
  onPressAddressCopy: () => void
}

export function Balance({
  activeChainId,
  chains,
  isLoading,
  balanceAmount,
  chainName,
  safeAddress,
  onPressAddressCopy,
}: BalanceProps) {
  const router = useRouter()
  const colorScheme = useColorScheme()

  const showSkeleton = isLoading || !balanceAmount

  return (
    <View>
      <View marginBottom="$4">
        {activeChainId && (
          <XStack paddingBottom={'$4'} alignItems={'center'}>
            <DropdownLabel
              label={chainName}
              leftNode={<ChainsDisplay activeChainId={activeChainId} chains={chains} max={1} />}
              onPress={() => {
                router.push('/networks-sheet')
              }}
              labelProps={{ fontWeight: 600 }}
              displayDropDownIcon={chains.length > 1}
            />
            <TouchableOpacity onPress={onPressAddressCopy}>
              <XStack alignItems={'center'} paddingLeft={'$1'}>
                <Text color={'$colorSecondary'}>{shortenAddress(safeAddress)}</Text>
                <View paddingLeft={'$1'}>
                  <SafeFontIcon name={'copy'} size={13} color={'$colorSecondary'} />
                </View>
              </XStack>
            </TouchableOpacity>
          </XStack>
        )}
        <Skeleton.Group show={showSkeleton}>
          <Skeleton colorMode={colorScheme === 'dark' ? 'dark' : 'light'} width={220}>
            <Fiat value={balanceAmount} currency="usd" precise={shouldDisplayPreciseBalance(balanceAmount)} />
          </Skeleton>
        </Skeleton.Group>
      </View>
    </View>
  )
}
