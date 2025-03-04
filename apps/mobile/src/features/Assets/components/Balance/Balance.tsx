import React from 'react'
import { Spinner, View } from 'tamagui'

import { Alert } from '@/src/components/Alert'
import { DropdownLabel } from '@/src/components/Dropdown'
import { Fiat } from '@/src/components/Fiat'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import { ChainsDisplay } from '@/src/components/ChainsDisplay'
import { useRouter } from 'expo-router'

interface BalanceProps {
  activeChainId: string
  isLoading: boolean
  chains: Chain[]
  balanceAmount: string
  chainName: string
}

export function Balance({ activeChainId, chains, isLoading, balanceAmount, chainName }: BalanceProps) {
  const router = useRouter()

  return (
    <View>
      <View marginBottom="$4">
        {activeChainId && (
          <View paddingBottom={'$4'}>
            <DropdownLabel
              label={chainName}
              leftNode={<ChainsDisplay activeChainId={activeChainId} chains={chains} max={1} />}
              onPress={() => {
                router.push('/networks-sheet')
              }}
            />
          </View>
        )}

        {isLoading ? (
          <Spinner />
        ) : balanceAmount ? (
          <Fiat baseAmount={balanceAmount} />
        ) : (
          <Alert type="error" message="error while getting the balance of your wallet" />
        )}
      </View>
    </View>
  )
}
