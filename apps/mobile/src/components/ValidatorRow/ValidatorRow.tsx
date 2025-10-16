import { View, Text } from 'tamagui'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { getBeaconChainLink } from '@safe-global/utils/features/stake/utils/beaconChain'
import { Link, ExternalPathString } from 'expo-router'

export const ValidatorRow = ({ validatorIds }: { validatorIds: string[] }) => {
  const chain = useAppSelector(selectActiveChain)

  if (!chain || validatorIds.length === 0) {
    return null
  }

  return (
    <View flexDirection="row" gap="$1" flexWrap="wrap" flex={1} flexShrink={1} justifyContent="flex-end">
      {validatorIds.map((validatorId, index) => (
        <Link href={getBeaconChainLink(chain.chainId, validatorId) as ExternalPathString} key={validatorId}>
          <Text fontSize="$4" textDecorationLine="underline">
            Validator {index + 1}
          </Text>
          <Text fontSize="$4">{index < validatorIds.length - 1 && ' |'}</Text>
        </Link>
      ))}
    </View>
  )
}
